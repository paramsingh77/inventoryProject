import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

const CategoryGrid = ({ categories }) => {
  return (
    <Row className="g-4">
      {categories.map(category => (
        <Col key={category.id} md={4} lg={3}>
          <Card 
            className="h-100 cursor-pointer" 
            onClick={() => navigate(`/inventory/category/${category.id}`)}
          >
            <Card.Body>
              <div className="text-center">
                <div className="category-icon mb-3">
                  {/* Category icon */}
                </div>
                <h5>{category.name}</h5>
                <div className="text-primary fw-bold">
                  {category.itemCount} items
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}; 