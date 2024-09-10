import React, { useEffect, useState } from 'react';
import { Pagination } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, useParams } from 'react-router-dom';

const MoviesPage = () => {
  const { pageNumber } = useParams();
  const [movies, setMovies] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const itemsPerPage = 12;
  const pageRange = 5;
  const currentPage = Number(pageNumber) || 1;

  useEffect(() => {
    const fetchMovies = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        navigate('/login');
        return;
      }

      const controller = new AbortController(); 
      const { signal } = controller;

      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:8000/api/movies/?page=${currentPage}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          signal,
        });

        if (response.status === 401) {
          navigate('/login');
        } else if (response.ok) {
          const data = await response.json();
          setMovies(data.results || []);
          const totalItems = data.count;
          const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
          setTotalPages(calculatedTotalPages);
          setError('');
        } else {
          setError('Failed to load movies.');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError('Something went wrong. Please try again later.');
        }
      } finally {
        setLoading(false);
      }

      return () => {
        controller.abort(); 
      };
    };

    fetchMovies(); // pageNumber veya currentPage değiştiğinde tetikleniyor
  }, [currentPage, navigate]); // Sadece currentPage izleniyor

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      navigate(`/movies/page/${page}`);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const startPage = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);

  const handleMovieClick = (movieId) => {
    navigate(`/movies/${movieId}`);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Movies</h1>
      {loading && <div className="alert alert-info">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row">
        {movies.length > 0 ? (
          movies.map((movie) => (
            <div
              className="col-md-3 mb-4"
              key={movie.tmdb_id}
              onClick={() => handleMovieClick(movie.tmdb_id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card">
                <img
                  src={movie.poster_path}
                  className="card-img-top"
                  alt={movie.title}
                  style={{ height: '400px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{movie.title}</h5>
                  <p className="card-text">{movie.overview}</p>
                  <p className="card-text">
                    <small className="text-muted">Release Date: {movie.release_date}</small>
                  </p>
                  <p className="card-text">
                    <small className="text-muted">Rating: {movie.vote_average}</small>
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No movies available.</p>
        )}
      </div>

      <Pagination className="justify-content-center mt-4">
        <Pagination.First
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        />
        {Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx).map((pageNum) => (
          <Pagination.Item
            key={pageNum}
            active={pageNum === currentPage}
            onClick={() => handlePageChange(pageNum)}
          >
            {pageNum}
          </Pagination.Item>
        ))}
        <Pagination.Ellipsis />
        <Pagination.Item onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
        <Pagination.Next
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        />
        <Pagination.Last
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    </div>
  );
};

export default MoviesPage;
