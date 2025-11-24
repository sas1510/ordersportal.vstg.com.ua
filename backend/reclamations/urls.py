from django.urls import path
from .views import get_issue_complaints, get_gm_solutions, get_complaint_series_by_order, ReclamationViewSet


urlpatterns = [
    path('issues/', get_issue_complaints, name='get_issue_complaints'),
    path('solutions/<str:reason_id>/', get_gm_solutions, name='get_gm_solutions'),
    path('create_complaints/', ReclamationViewSet.as_view({'post': 'create'}), name='create_complaints'),
    path('get_series/<str:order_number>/', get_complaint_series_by_order, name='get_series'),
    # path('complaints-full/', GetComplaintsFullView.as_view(), name='complaints-full'),
    # path("<int:complaint_id>/photos/", get_complaint_photos, name="complaint-photos"),

]



