"""Management PDF: document counts, construction quantities and actual document states."""
from io import BytesIO
from datetime import datetime
from zoneinfo import ZoneInfo
from xml.sax.saxutils import escape

def build_reconciliation_pdf(report):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4,landscape
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak
    from reportlab.graphics.shapes import Drawing,Rect,String
    from .deliveries_pdf import deliveries_font_path
    font='DealerManagementManrope'
    if font not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(font,str(deliveries_font_path())))
    stream=BytesIO();width,height=landscape(A4);available=width-56
    style=ParagraphStyle('manager',fontName=font,fontSize=8,leading=11,textColor=colors.HexColor('#17324d'))
    title=ParagraphStyle('managerTitle',parent=style,fontSize=19,leading=25,spaceAfter=12,keepWithNext=True)
    heading=ParagraphStyle('managerHeading',parent=style,fontSize=12,leading=16,spaceBefore=12,spaceAfter=9,keepWithNext=True)
    def p(value): return Paragraph(escape(str(value)).replace('\n','<br/>'),style)
    def n(value): return f'{value:g}' if isinstance(value,(int,float)) else str(value)
    def share(value,total): return f'{100*value/total:.1f}%' if total else '0.0%'
    def table(headers,rows,widths):
        result=Table([[p(v) for v in headers]]+[[p(v) for v in row] for row in rows],colWidths=widths,repeatRows=1,hAlign='LEFT')
        commands=[('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e6eef7')),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#d9e2eb')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f6f9fc')]),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]
        if len(rows)>=2: commands.append(('NOSPLIT',(0,len(rows)-1),(-1,len(rows))))
        result.setStyle(TableStyle(commands));return result
    totals=report['totals'];period=report['period'];rows=report['rows']
    stamp=datetime.fromisoformat(report['generatedAt']).astimezone(ZoneInfo('Europe/Kyiv')).strftime('%d.%m.%Y %H:%M') if report.get('generatedAt') else ''
    story=[Paragraph('Звіт керівника: новий портал',title),p(f"{period['from']} - {period['to']} | Усі статуси документів"),Spacer(1,5),
        p('Заявки / прорахунки - документи нового порталу. Статуси актуальні на момент формування. Документи з позначкою видалення виключено; непроведені включено.'),Spacer(1,12)]
    stages=[['Заявки / прорахунки звітного періоду',totals['applications'],n(totals['applicationConstructions'])],
        ['Пов’язані замовлення - усі статуси',totals['linkedOrders'],n(totals['linkedConstructions'])],
        ['Із них «Подтверждено»',totals['confirmedLinkedOrders'],n(totals['confirmedLinkedConstructions'])]]
    story += [table(['Етап','Документів','Конструкцій'],stages,[available-270,135,135]),Spacer(1,10),
        p(f"Заявок: {totals['applications']}. Із замовленнями: {totals['applicationsWithOrders']}. Пов’язаних замовлень: {totals['linkedOrders']}. Заявок без замовлень: {totals['withoutOrders']}. Конверсія заявок у підтверджені замовлення: {totals['conversion']:.1f}%. Дилерів у відборі: {totals['dealers']}."),Paragraph('Конструкції на кожному етапі',heading)]
    chart=Drawing(available,170)
    segments=[('Заявки / прорахунки',totals['applicationConstructions'],'#2563eb'),('Пов’язані замовлення всіх статусів',totals['linkedConstructions'],'#7c3aed'),('Із них підтверджені',totals['confirmedLinkedConstructions'],'#16a34a')]
    maximum=max([value for _,value,_ in segments]+[1])
    for index,(label,value,color) in enumerate(segments):
        y=135-index*50
        chart.add(String(0,y+18,label,fontName=font,fontSize=9))
        length=(available-80)*value/maximum
        chart.add(Rect(0,y-4,length,16,fillColor=colors.HexColor(color),strokeColor=None))
        chart.add(String(length+8,y,n(value),fontName=font,fontSize=10))
    story += [chart,p('У головному порівнянні відібрані заявки за датою створення; замовлення пов’язані саме з ними та датовані не пізніше кінцевої дати звіту. Кожен GUID замовлення враховано один раз.'),PageBreak(),Paragraph('Розподіл документів за статусами',title)]
    for label,items in [('Заявки / прорахунки',totals['applicationStatuses']),('Пов’язані замовлення',totals['orderStatuses']),('Усі замовлення за датою документа у звітному періоді',totals['periodOrderStatuses'])]:
        story.append(Paragraph(label,heading))
        count=sum(row['documents'] for row in items);quantity=sum(row['constructions'] for row in items)
        statusrows=[[row['name'],row['documents'],share(row['documents'],count),n(row['constructions']),share(row['constructions'],quantity)] for row in items]
        statusrows.append(['Усього',count,share(count,count),n(quantity),share(quantity,quantity)])
        story.append(table(['Статус','Документів','Частка документів','Конструкцій','Частка конструкцій'],statusrows,[available-420,90,110,110,110]))
    story += [Spacer(1,10),p('Власний статус заявки та статуси її замовлень зберігаються окремо. Кількість заявок у стані підтвердження може відрізнятися від кількості заявок із підтвердженими замовленнями.'),PageBreak(),Paragraph('Області та філіал',title)]
    def metric_row(label,group):
        return [label,group['applications'],n(group['applicationConstructions']),group['linkedOrders'],n(group['linkedConstructions']),group['confirmedLinkedOrders'],n(group['confirmedLinkedConstructions']),f"{group['conversion']:.1f}%"]
    regional=[metric_row(group['name'],group) for group in report['regions']]+[metric_row('Усього',totals)]
    headers=['Область / філіал','Заявок / прорахунків','Конструкцій у заявках','Замовлень із заявок','Конструкцій у замовленнях','Підтверджених замовлень','Підтверджених конструкцій','Конверсія заявок']
    story += [table(headers,regional,[175,75,95,90,100,90,95,available-720]),Spacer(1,12),p('Конверсія = заявки з хоча б одним замовленням у стані «Подтверждено» / усі заявки. Підтверджені документи входять до загальної кількості замовлень і не додаються до неї повторно.'),Paragraph('Контроль за датою замовлення',heading),
        p(f"Усі замовлення у 1С: {totals['total']} / {n(totals['orderConstructions'])} констр.; із них «Подтверждено»: {totals['confirmedOrders']} / {n(totals['confirmedConstructions'])} констр. Віднесено до нового порталу: {totals['newOrders']} / {n(totals['newConstructions'])} констр."),
        p('Цей контрольний блок використовує дату замовлення, тому його кількості можуть відрізнятися від головного порівняння за датою заявки.'),Spacer(1,10),p('Номери документів, власні статуси заявок та статуси пов’язаних замовлень наведені в деталізації порталу й CSV. У CSV кожен документ має окремий рядок; заявка і замовлення позначені різними типами.'),PageBreak(),Paragraph('Порівняння за дилерами',title)]
    for region in report['regions']:
        story.append(Paragraph(escape(region['name']),heading))
        region_rows=[metric_row(row['name'],{**row,'conversion':100*row['convertedApplications']/row['applications'] if row['applications'] else 0}) for row in rows if row['region']==region['name']]
        region_rows.append(metric_row('РАЗОМ',region))
        story.append(table(['Дилер',*headers[1:]],region_rows,[215,65,95,80,95,85,90,available-725]))
    if not rows: story.append(p('За поточним відбором дилерів немає.'))
    def footer(canvas,document):
        canvas.setFont(font,8);canvas.setFillColor(colors.HexColor('#64748b'))
        canvas.drawString(28,17,f"Новий портал | {period['from']} - {period['to']} | Сформовано {stamp} (Київ)")
        canvas.drawRightString(width-28,17,f'Сторінка {document.page}')
    SimpleDocTemplate(stream,pagesize=(width,height),leftMargin=28,rightMargin=28,topMargin=28,bottomMargin=32,title='Звіт керівника: новий портал',author='Вікна Стиль').build(story,onFirstPage=footer,onLaterPages=footer)
    return stream.getvalue()

