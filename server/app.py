
from django.db import models
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.conf import settings
from django.urls import path
from django.apps import AppConfig
from django.core.asgi import get_asgi_application
from decimal import Decimal
import json
import os

# Configure Django settings
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
        'django.contrib.contenttypes',
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

# Models
class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.URLField()
    description = models.TextField(null=True, blank=True)
    inventory = models.IntegerField(default=0)
    category = models.CharField(max_length=255, null=True, blank=True)

class CartItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

# API Views
@csrf_exempt
def get_products(request):
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 20))
    query = request.GET.get('query')
    category = request.GET.get('category')
    min_price = request.GET.get('minPrice')
    max_price = request.GET.get('maxPrice')
    sort_by = request.GET.get('sortBy')
    sort_order = request.GET.get('sortOrder')


@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            user = User.objects.create_user(
                username=data['username'],
                password=data['password'],
                email=data.get('email', '')
            )
            return JsonResponse({'status': 'success', 'userId': user.id})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = authenticate(
            username=data['username'],
            password=data['password']
        )
        if user:
            login(request, user)
            return JsonResponse({
                'status': 'success',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'isAdmin': user.is_staff
                }
            })
        return JsonResponse({'status': 'error', 'message': 'Invalid credentials'}, status=401)

@csrf_exempt
def logout_user(request):
    logout(request)
    return JsonResponse({'status': 'success'})

    products = Product.objects.all()

    if query:
        products = products.filter(name__icontains=query)
    if category:
        products = products.filter(category=category)
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)
    if sort_by:
        order = '-' if sort_order == 'desc' else ''
        products = products.order_by(f'{order}{sort_by}')

    paginator = Paginator(products, limit)
    page_obj = paginator.get_page(page)
    
    data = [{
        'id': p.id,
        'name': p.name,
        'price': str(p.price),
        'image': p.image,
        'description': p.description,
        'inventory': p.inventory,
        'category': p.category
    } for p in page_obj]

    return JsonResponse({
        'data': data,
        'pagination': {
            'total': paginator.count,
            'page': page,
            'limit': limit,
            'totalPages': paginator.num_pages
        }
    })

@csrf_exempt
def get_cart(request):
    cart_items = CartItem.objects.select_related('product').all()
    data = [{
        'id': item.id,
        'productId': item.product.id,
        'quantity': item.quantity,
        'product': {
            'id': item.product.id,
            'name': item.product.name,
            'price': str(item.product.price),
            'image': item.product.image,
            'description': item.product.description,
            'inventory': item.product.inventory,
            'category': item.product.category
        }
    } for item in cart_items]
    return JsonResponse(data, safe=False)

urlpatterns = [
    path('api/products', get_products),
    path('api/cart', get_cart),
]

application = get_asgi_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(application, host="0.0.0.0", port=5000)
