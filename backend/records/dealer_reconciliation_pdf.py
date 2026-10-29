"""PDF from the same snapshot and filters as the portal screen."""
from io import BytesIO
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
    font='DealerPortalManrope'
    if font not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(font,str(deliveries_font_path())))
    stream=BytesIO(); width,height=landscape(A4); available=width-56
    style=ParagraphStyle('dp',fontName=font,fontSize=8,leading=11,textColor=colors.HexColor('#17324d'))
    title=ParagraphStyle('dpTitle',parent=style,fontSize=19,leading=25,spaceAfter=12,keepWithNext=True)
    heading=ParagraphStyle('dpHeading',parent=style,fontSize=13,leading=18,spaceBefore=12,spaceAfter=9,keepWithNext=True)
    def p(value): return Paragraph(escape(str(value)).replace('\n','<br/>'),style)
    def table(headers,rows,widths):
        result=Table([[p(v) for v in headers]]+[[p(v) for v in row] for row in rows],colWidths=widths,repeatRows=1,hAlign='LEFT')
        result.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e6eef7')),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#d9e2eb')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f6f9fc')]),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
        return result
    def n(v): return f'{v:g}' if isinstance(v,(int,float)) else str(v)
    def share(v,total): return f'{n(v)} ({100*v/total:.1f}%)' if total else '0 (0.0%)'
    t=report['totals']; period=report['period']; rows=report['rows']
    story=[Paragraph('Новий портал: заявки та конструкції',title),p(f"{period['from']} - {period['to']} | Замовлення лише «Подтверждено»"),Spacer(1,12),
        p(f"Дилерів у відборі: {t['dealers']} | На новому порталі: {share(t['onPortal'],t['dealers'])} | Заявок: {t['applications']} | Конструкцій у заявках: {n(t['applicationConstructions'])}"),Spacer(1,8),
        p(f"Пов'язаних підтверджених замовлень: {t['linkedOrders']} | Конструкцій у них: {n(t['linkedConstructions'])} | Конверсія заявок: {t['conversion']:.1f}%"),Paragraph('Дилери за областями',heading)]
    stats=[[g['name'],g['dealers'],share(g['onPortal'],g['dealers'])] for g in report['regions']]
    stats.append(['Усього',t['dealers'],share(t['onPortal'],t['dealers'])])
    story.append(table(['Область / філіал','Усього у 1С','Новий портал'],stats,[330,160,available-490]))
    story += [PageBreak(),Paragraph('Заявки та пов’язані підтверджені замовлення',title),p('Заявки створено у звітному періоді. Замовлення пов’язані саме з цими заявками та підтверджені станом на час формування; дата замовлення - до кінця відбору.'),Spacer(1,10)]
    metrics=[[g['name'],g['applications'],n(g['applicationConstructions']),g['linkedOrders'],n(g['linkedConstructions']),n(g['difference']),f"{g['conversion']:.1f}%"] for g in report['regions']]
    metrics.append(['Усього',t['applications'],n(t['applicationConstructions']),t['linkedOrders'],n(t['linkedConstructions']),n(t['difference']),f"{t['conversion']:.1f}%"])
    story.append(table(['Область / філіал','Заявок','Конструкцій у заявках','Замовлень із заявок','Конструкцій у замовленнях','Різниця конструкцій','Конверсія заявок'],metrics,[210,65,110,110,110,85,available-690]))
    story += [Spacer(1,12),p('Конверсія = заявки, що мають хоча б одне підтверджене замовлення / усі заявки. Різниця = конструкції у заявках мінус конструкції у пов’язаних замовленнях; вона не означає відмову клієнта.'),PageBreak(),Paragraph('Конструкції: заявки та замовлення',title)]
    chart=Drawing(available,250)
    segments=[('Усі заявки',t['applicationConstructions'],'#2563eb'),('У підтверджених замовленнях із цих заявок',t['linkedConstructions'],'#7c3aed')]
    maximum=max([item[1] for item in segments]+[1])
    for i,(label,value,color) in enumerate(segments):
        y=215-i*58
        chart.add(String(0,y+22,label,fontName=font,fontSize=10))
        length=(available-90)*value/maximum
        chart.add(Rect(0,y-5,length,17,fillColor=colors.HexColor(color),strokeColor=None))
        chart.add(String(length+8,y-1,n(value),fontName=font,fontSize=10))
    story += [chart,Paragraph('Підтверджені замовлення звітного періоду',heading),p(f"Усього у 1С: {t['total']} замовлень / {n(t['orderConstructions'])} конструкцій. Із нового порталу: {t['newOrders']} замовлень / {n(t['newConstructions'])} конструкцій. Ці показники групуються за датою замовлення, тому відрізняються від заявок звітного періоду."),PageBreak(),Paragraph('Порівняння за дилерами',title)]
    if not rows: story.append(p('За поточним відбором дилерів немає.'))
    for group in report['regions']:
        story.append(Paragraph(escape(group['name']),heading))
        detail=[[r['name'],r['applications'],n(r['applicationConstructions']),r['linkedOrders'],n(r['linkedConstructions']),r['total'],n(r['orderConstructions'])] for r in rows if r['region']==group['name']]
        detail.append(['РАЗОМ',group['applications'],n(group['applicationConstructions']),group['linkedOrders'],n(group['linkedConstructions']),group['total'],n(group['orderConstructions'])])
        story.append(table(['Дилер','Заявок','Конструкцій у заявках','Пов’язаних замовлень','Конструкцій у них','Усіх замовлень 1С','Конструкцій у 1С'],detail,[245,60,100,100,100,90,available-695]))
    story += [PageBreak(),Paragraph('Заявка → підтверджені замовлення',title)]
    apps=[[r['name'],a['number'],a['date'],n(a['constructions']),', '.join(o['number'] for o in a['orders']) or 'Немає',n(a['orderConstructions'])] for r in rows for a in r['applicationDetails']]
    if apps:
        story += [p('Якщо одне замовлення пов’язане з кількома заявками, воно видиме в кожній із них. У підсумках дилерів, областей та всього звіту кожне замовлення враховане один раз.'),Spacer(1,10),table(['Дилер','Заявка','Дата','Конструкцій у заявці','Замовлення','Конструкцій у замовленнях'],apps,[200,90,85,95,190,available-660])]
    else: story.append(p('Заявок за звітний період немає.'))
    def footer(canvas,doc):
        canvas.setFont(font,8); canvas.setFillColor(colors.HexColor('#64748b'))
        canvas.drawString(28,17,f"Новий портал | {period['from']} - {period['to']} | «Подтверждено»")
        canvas.drawRightString(width-28,17,f'Сторінка {doc.page}')
    SimpleDocTemplate(stream,pagesize=(width,height),leftMargin=28,rightMargin=28,topMargin=28,bottomMargin=32,title='Новий портал: заявки та конструкції',author='Вікна Стиль').build(story,onFirstPage=footer,onLaterPages=footer)
    return stream.getvalue()
