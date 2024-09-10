# myapp/urls.py
from django.urls import path, include
from .views import CustomLogoutView, UserListView, MovieListCreateView, MovieDetailView, WatchedCreateView, \
    ImportMoviesView, AdminMovieSearchView, RatingViewSet, ReviewViewSet, ReviewLikeView

from .views import CustomTokenObtainPairView

urlpatterns = [
    # Djoser JWT URL'leri
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', include('djoser.urls.jwt')),
    path('token/', include('djoser.urls')),
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('userlist/', UserListView.as_view(), name='user-list'),  # User list endpoint
    path('movies/', MovieListCreateView.as_view(), name='movie-list-create'),
    path('movies/<str:tmdb_id>/', MovieDetailView.as_view(), name='movie-detail'),
    path('movies/watched/', WatchedCreateView.as_view(), name='watched-create'),
    path('import/', ImportMoviesView.as_view(), name='import_movies'),
    path('admin/movies/', AdminMovieSearchView.as_view(), name='admin-movie-search'),
    # List all ratings for a specific movie
    path('movies/<int:tmdb_id>/ratings/', RatingViewSet.as_view({'get': 'list', 'post': 'create'}), name='rating-list'),

    # Retrieve, update, or delete a specific rating for a movie
    path('movies/<int:tmdb_id>/ratings/<int:pk>/',
         RatingViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
         name='rating-detail'),
    path('movies/<int:tmdb_id>/reviews/', ReviewViewSet.as_view({'get': 'list', 'post': 'create'})
, name='review-list'),  # List and create reviews
    path('movies/<int:tmdb_id>/reviews/<int:pk>/', ReviewViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'})

, name='review-detail'),  # Retrieve, update, delete review
    path('movies/<int:tmdb_id>/reviews/<int:review_id>/like/', ReviewLikeView.as_view(), name='review-like'),
    path('movies/<int:tmdb_id>/reviews/<int:review_id>/unlike/', ReviewLikeView.as_view(), name='review-unlike'),


]
