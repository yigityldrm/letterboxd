import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');

  const accessToken = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchUser = async () => {
      if (!accessToken) {
        setError('No access token found.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/token/users/me/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setEditUsername(data.username);
        } else if (response.status === 401) {
          setError('Unauthorized: Please log in.');
        } else {
          setError('Failed to fetch user data.');
        }
      } catch (error) {
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [accessToken]);

  const handleEditClick = () => setShowEditModal(true);
  const handleCloseModal = () => setShowEditModal(false);

  const handleEditChange = (event) => setEditUsername(event.target.value);

  const handleSaveChanges = async () => {
    if (!accessToken) {
      setError('No access token found.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/me/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: editUsername }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        handleCloseModal();
      } else {
        setError('Failed to update user data.');
      }
    } catch (error) {
      setError('Something went wrong.');
    }
  };

  return (
    <div className="container mt-4">
      <h1>User Profile</h1>
      {loading && <div className="alert alert-info">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {user && (
        <div>
          <h2>{user.username}</h2>
          <p>Email: {user.email}</p>
          <p>ID: {user.id}</p>
          <p>Superuser: {user.is_superuser ? 'Yes' : 'No'}</p>
          {user.is_superuser && (
            <Button variant="primary" onClick={handleEditClick}>
              Edit
            </Button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={editUsername}
                onChange={handleEditChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserProfile;
