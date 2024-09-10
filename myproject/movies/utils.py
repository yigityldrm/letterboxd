import requests
from .models import Movie
from django.db import transaction

from django.conf import settings
from datetime import datetime


def fetch_movies_from_tmdb(page=1):
    """Fetch a page of movies from TMDB."""
    url = f'{settings.TMDB_API_URL_POPULAR}?api_key={settings.TMDB_API_KEY}&page={page}'
    response = requests.get(url)
    response.raise_for_status()  # Raise an error for bad requests
    return response.json()


def save_movies_to_db():
    """Fetch and save 1000 movies from TMDB to the database with race condition handling."""
    page = 1
    movies_saved = 0
    total_movies_to_save = 1000
    batch_size = 100  # Number of movies to save in one bulk_create operation

    while movies_saved < total_movies_to_save:
        movie_data = fetch_movies_from_tmdb(page)
        movies_to_create = []
        movie_ids = [movie['id'] for movie in movie_data['results']]

        existing_movies = Movie.objects.filter(tmdb_id__in=movie_ids).values_list('tmdb_id', flat=True)
        existing_ids = set(existing_movies)

        for movie in movie_data['results']:
            if movies_saved >= total_movies_to_save:
                break

            if movie['id'] in existing_ids:
                continue

            release_date_str = movie.get('release_date', None)
            release_date = None
            if release_date_str:
                try:
                    release_date = datetime.strptime(release_date_str, "%Y-%m-%d").date()
                except ValueError:
                    release_date = None  # Set to None if the date is invalid

            movies_to_create.append(Movie(
                tmdb_id=movie['id'],
                title=movie['title'],
                overview=movie['overview'],
                release_date=release_date,
                vote_average=movie['vote_average'],
                poster_path=f"https://image.tmdb.org/t/p/w500{movie['poster_path']}",
                average_rating=0
            ))
            movies_saved += 1

            if len(movies_to_create) == batch_size:
                with transaction.atomic():
                    Movie.objects.bulk_create(movies_to_create)
                movies_to_create = []

        if movies_to_create:
            with transaction.atomic():
                Movie.objects.bulk_create(movies_to_create)

        page += 1

    print(f"{movies_saved} movies saved to the database.")
