from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db.models import Avg
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction


class Movie(models.Model):
    tmdb_id = models.IntegerField(unique=True)  # Unique ID from TMDB API
    title = models.CharField(max_length=255)
    overview = models.TextField()
    release_date = models.DateField(null=True, blank=True)
    vote_average = models.FloatField()
    average_rating = models.FloatField(default=0.0)

    poster_path = models.URLField()

    def __str__(self):
        return self.title


class Watched(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    watched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'movie')


class Rating(models.Model):
    movie = models.ForeignKey(Movie, related_name='ratings', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='ratings', on_delete=models.CASCADE)
    rating = models.FloatField()

    class Meta:
        unique_together = ('movie', 'user')

    def __str__(self):
        return f'{self.user} rated {self.movie}'


class Review(models.Model):
    movie = models.ForeignKey(Movie, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='reviews', on_delete=models.CASCADE)
    text = models.TextField()
    like_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('movie', 'user')

    def __str__(self):
        return f'{self.user} reviewed {self.movie}'


@receiver(post_save, sender=Rating)
@receiver(post_delete, sender=Rating)
def update_rating(instance, **kwargs):
    update_movie_average_rating(instance.movie)


@transaction.atomic
def update_movie_average_rating(movie):
    ratings = movie.ratings.all()
    if ratings.exists():
        avg_rating = ratings.aggregate(average=Avg('rating'))['average']
        movie.average_rating = avg_rating
    else:
        movie.average_rating = 0.0
    movie.save()


class ReviewLike(models.Model):
    review = models.ForeignKey(Review, related_name='likes', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='review_likes', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('review', 'user')


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'  ##Specifies the field to be used for authentication
    REQUIRED_FIELDS = ['username']
