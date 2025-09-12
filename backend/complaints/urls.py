from django.urls import path
from .views import get_issue_complaints, get_gm_solutions, ComplaintViewSet, get_complaint_series_by_order

urlpatterns = [
    path('issues/', get_issue_complaints, name='get_issue_complaints'),
    path('solutions/<str:reason_id>/', get_gm_solutions, name='get_gm_solutions'),
    path('create_complaints/', ComplaintViewSet.as_view({'post': 'create'}), name='create_complaints'),
    path('get_series/<str:order_number>/', get_complaint_series_by_order, name='get_series'),

]
