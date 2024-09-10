// src/components/Home.js
import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container className="my-5 text-center">
      <h1>Welcome to My App</h1>
      <Button variant="link" as={Link} to="/login">
        Login
      </Button>
      <Button variant="link" as={Link} to="/register">
        Register
      </Button>
    </Container>
  );
};

export default Home;
