import logging
from typing import Type

from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework import generics, permissions
from rest_framework.decorators import action

from . import models
from .models import Movie, Rating, Review, Watched, ReviewLike
from .serializers import MovieSerializer, RatingSerializer, ReviewSerializer, WatchedSerializer
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from .permissions import  IsSuperuser, IsSuperUserOrReadOnly
from .utils import save_movies_to_db
from datetime import datetime
from rest_framework.generics import GenericAPIView, get_object_or_404
import requests
from rest_framework.pagination import PageNumberPagination

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        return response


class CustomLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Get the refresh token from the request body instead of cookies
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'No refresh token provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_204_NO_CONTENT)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all().values('username', 'email')
        return Response(users)


class ImportMoviesView(APIView):
    """
    API view to import movies from TMDB. Only accessible to superusers who are logged in.
    """
    permission_classes = [IsAuthenticated, IsSuperuser]

    def get(self, request, *args, **kwargs):
        try:
            save_movies_to_db()
            return Response({"message": "Movies imported successfully."})
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# Custom paginator to define the page size
class CustomPageNumberPagination(PageNumberPagination):
    page_size = 12  # Customize the page size here
    page_size_query_param = 'page_size'  # Allow clients to set the page size via query parameters
    max_page_size = 100  # Set a maximum page size limit


class MovieListCreateView(generics.ListCreateAPIView):
    queryset = Movie.objects.all().order_by('id')
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPageNumberPagination

    def perform_create(self, serializer):
        serializer.save()


class MovieDetailView(generics.RetrieveUpdateDestroyAPIView):
    def get_queryset(self):  # only valid movies

        return Movie.objects.all()

    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated,
                          IsSuperUserOrReadOnly]  # Only authenticated users, and owner can edit , IsOwnerOrReadOnly

    def get_object(self):  ##id değil tmdbid istediğim için custom

        tmdb_id = self.kwargs.get('tmdb_id')
        try:
            return Movie.objects.get(tmdb_id=tmdb_id)
        except Movie.DoesNotExist:
            raise NotFound("Movie not found")

    def perform_update(self, serializer):
        # Set updated_by field to the current user
        serializer.save(updated_by=self.request.user)


class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def get_movie(self):
        """
        Helper method to get the movie object using tmdb_id from the URL.
        """
        tmdb_id = self.kwargs.get('tmdb_id')
        try:
            return Movie.objects.get(tmdb_id=tmdb_id)
        except Movie.DoesNotExist:
            raise ValidationError({'detail': 'Movie with the given tmdb_id does not exist.'})

    def get_queryset(self):
        movie = self.get_movie()
        return Rating.objects.filter(movie=movie)

    def perform_create(self, serializer):
        movie = self.get_movie()  # Get movie based on tmdb_id
        if Rating.objects.filter(movie=movie, user=self.request.user).exists():
            raise ValidationError({'detail': 'You have already rated this movie.'})
        serializer.save(user=self.request.user, movie=movie)  # Save with the movie instance

    def perform_update(self, serializer):
        rating = self.get_object()  # Get the specific rating instance
        if rating.user != self.request.user:
            raise PermissionDenied('You do not have permission to update this rating.')
        serializer.save()

    def perform_destroy(self, instance):
        with transaction.atomic():
            instance.delete()
            transaction.on_commit(lambda: print("Deleted rating with id:", instance.id))


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_movie(self):
        tmdb_id = self.kwargs.get('tmdb_id')
        try:
            return Movie.objects.get(tmdb_id=tmdb_id)
        except Movie.DoesNotExist:
            raise ValidationError({'detail': 'Movie with the given id does not exist.'})

    def get_queryset(self):
        movie = self.get_movie()
        return Review.objects.filter(movie=movie)

    def perform_create(self, serializer):
        movie = self.get_movie()
        if Review.objects.filter(movie=movie, user=self.request.user).exists():
            raise PermissionDenied('You have already reviewed this movie.')
        serializer.save(user=self.request.user, movie=movie)

    def perform_update(self, serializer):
        review = self.get_object()
        if review.user != self.request.user:
            raise PermissionDenied('You do not have permission to update this review.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied('You do not have permission to delete this review.')
        with transaction.atomic():
            instance.delete()
            transaction.on_commit(lambda: print("Deleted review with id:", instance.id))


class ReviewLikeView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, tmdb_id, review_id):
        """
        Handles adding a like to a review.
        """
        review = get_object_or_404(Review, id=review_id, tmdb_id=tmdb_id)
        if ReviewLike.objects.filter(review=review, user=request.user).exists():
            return Response({"detail": "You have already liked this review."}, status=status.HTTP_400_BAD_REQUEST)

        # Add a like to the review
        ReviewLike.objects.create(review=review, user=request.user)
        review.like_count += 1
        review.save()

        return Response({"detail": "Review liked successfully.", "like_count": review.like_count}, status=status.HTTP_200_OK)

    @transaction.atomic
    def delete(self, request, tmdb_id, review_id):
        """
        Handles removing a like from a review.
        """
        review = get_object_or_404(Review, id=review_id, tmdb_id=tmdb_id)
        like = ReviewLike.objects.filter(review=review, user=request.user).first()

        if not like:
            return Response({"detail": "You haven't liked this review yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Remove the like
        like.delete()
        review.like_count -= 1
        review.save()

        return Response({"detail": "Review unliked successfully.", "like_count": review.like_count}, status=status.HTTP_200_OK)


class UserRatedMoviesListView(generics.ListAPIView):
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Movie.objects.filter(ratings__user=self.request.user).distinct()


class WatchedCreateView(generics.CreateAPIView):
    queryset = Watched.objects.all()
    serializer_class = WatchedSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        movie = serializer.validated_data['movie']
        movie.watched_count += 1
        movie.save()


class AdminMovieSearchView(APIView):
    permission_classes = [IsAuthenticated, IsSuperuser]  # Ensure only authenticated users access the view

    def get(self, request):
        query = request.query_params.get('query')

        if not query:
            return Response({"error": "Query parameter 'query' is required."}, status=status.HTTP_400_BAD_REQUEST)

        tmdb_url = f'{settings.TMDB_API_URL_SEARCH}?api_key={settings.TMDB_API_KEY}&query={query}'
        response = requests.get(tmdb_url)

        if response.status_code != 200:
            return Response({"error": f"Failed to fetch data from TMDB: {response.status_code}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Return movie titles with tmdb_id for selection
        movies = response.json().get('results', [])

        return Response(movies, status=status.HTTP_200_OK)

    def post(self, request):
        # Admin selects a movie using the tmdb_id
        tmdb_id = request.data.get('tmdb_id')

        if not tmdb_id:
            return Response({"error": "Movie 'tmdb_id' is required."}, status=status.HTTP_400_BAD_REQUEST)

        tmdb_url = f'{settings.TMDB_API_URL}/movie/{tmdb_id}?api_key={settings.TMDB_API_KEY}'
        response = requests.get(tmdb_url)

        if response.status_code != 200:
            return Response({"error": f"Failed to fetch movie details: {response.status_code}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Prepare the data to save to the database
        movie_data = response.json()
        release_date_str = movie_data.get('release_date', None)
        release_date = None
        if release_date_str:
            try:
                release_date = datetime.strptime(release_date_str, "%Y-%m-%d").date()
            except ValueError:
                release_date = None  # Set to None if the date is invalid

        # Movie data from TMDB
        movie_data_to_save = {
            'tmdb_id': movie_data['id'],
            'title': movie_data['title'],
            'overview': movie_data.get('overview', ''),  # Default to empty string if not available
            'release_date': release_date,
            'vote_average': movie_data.get('vote_average', 0),
            'poster_path': f"https://image.tmdb.org/t/p/w500{movie_data.get('poster_path', '')}"
        }

        # Update with any additional data sent from the frontend
        movie_data_to_save.update({
            'overview': request.data.get('overview', movie_data_to_save['overview']),
            'title': request.data.get('title', movie_data_to_save['title']),
            'release_date': request.data.get('release_date', movie_data_to_save['release_date']),
            'vote_average': request.data.get('vote_average', movie_data_to_save['vote_average']),
            'poster_path': request.data.get('poster_path', movie_data_to_save['poster_path'])
        })

        # Check if the movie already exists in the database
        if Movie.objects.filter(tmdb_id=tmdb_id).exists():
            return Response({"error": "Movie already exists in the database."}, status=status.HTTP_400_BAD_REQUEST)

        # Save movie details to the database
        serializer = MovieSerializer(data=movie_data_to_save)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
