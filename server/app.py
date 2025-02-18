
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.conf import settings
from django.urls import path
from django.apps import AppConfig
from django.core.asgi import get_asgi_application
import json
import os

settings.configure(
    DEBUG=True,
    SECRET_KEY='your-secret-key',
    ROOT_URLCONF=__name__,
    MIDDLEWARE=[
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'corsheaders.middleware.CorsMiddleware',
    ],
    INSTALLED_APPS=[
        'corsheaders',
    ],
    CORS_ALLOW_ALL_ORIGINS=True,
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DATABASE_URL'),
        }
    }
)

class ApiConfig(AppConfig):
    name = 'api'

@csrf_exempt
def get_products(request):
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 20))
    q = request.GET.get('q')
    category = request.GET.get('category')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    sort_by = request.GET.get('sort_by')
    sort_order = request.GET.get('sort_order')
    
    # Implement query logic here
    products = []  # Replace with actual database query
    paginator = Paginator(products, limit)
    page_obj = paginator.get_page(page)
    
    return JsonResponse({
        'data': list(page_obj),
        'pagination': {
            'total': paginator.count,
            'page': page,
            'limit': limit,
            'totalPages': paginator.num_pages
        }
    })

@csrf_exempt
def get_cart(request):
    # Implement cart retrieval logic
    items = []  # Replace with actual database query
    return JsonResponse(items, safe=False)

urlpatterns = [
    path('api/products', get_products),
    path('api/cart', get_cart),
]

application = get_asgi_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(application, host="0.0.0.0", port=5000)
