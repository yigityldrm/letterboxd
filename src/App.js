// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import UserList from './components/Users';
import Logout from './components/Logout';
import Navbar from './components/Navbar';
import MoviesPage from './components/MoviesPage';
import AdminMovieSearchPage from './components/MovieSearch';
import MovieDetail from './components/MovieDetail';

const App = () => {

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/userlist" element={<UserList />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/" element={<Home />} />
        <Route path="/movies/page/:pageNumber" element={<MoviesPage />} />
        <Route path="/movie-search" element={<AdminMovieSearchPage />} />
        <Route path="/movies/:tmdbId" element={<MovieDetail />} />
      </Routes>
    </Router>
  );
};

export default App;
