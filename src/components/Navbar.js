import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Letterboxd 
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Render navigation links except for Login and Register */}
            {location.pathname !== '/login' && location.pathname !== '/register' && (
              <>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/"
                    end
                  >
                    Home
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/movies/page/1"
                  >
                    Movies
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/favorites"
                  >
                    Favorites
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/profile"
                  >
                    Profile
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/userlist"
                  >
                    User List
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          {/* Conditionally render Logout link */}
          {location.pathname !== '/login' && location.pathname !== '/register' && (
            <div className="d-flex ms-auto">
              <NavLink
                className="btn btn-outline-light"
                to="/logout" // Link to the Logout page
              >
                Logout
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
