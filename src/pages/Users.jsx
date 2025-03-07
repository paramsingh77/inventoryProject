import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserShield,
  faUserCog,
  faHistory,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import UserList from '../components/Users/UserList';
import RoleManagement from '../components/Users/RoleManagement';
import UserActivity from '../components/Users/UserActivity';
import { NotificationProvider } from '../context/NotificationContext';

const Users = () => {
  const [activeModule, setActiveModule] = useState(null);

  const userModules = [
    {
      id: 'user-list',
      title: 'User Management',
      icon: faUsers,
      description: 'View, add, edit, and manage user accounts',
      component: UserList,
      stats: { value: '24', label: 'Total Users' }
    },
    {
      id: 'roles',
      title: 'Roles & Permissions',
      icon: faUserShield,
      description: 'Manage user roles and access permissions',
      component: RoleManagement,
      stats: { value: '5', label: 'User Roles' }
    },
    {
      id: 'activity',
      title: 'User Activity',
      icon: faHistory,
      description: 'Track and monitor user actions and login history',
      component: UserActivity,
      stats: { value: '156', label: 'Actions Today' }
    }
  ];

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
  };

  const handleBack = () => {
    setActiveModule(null);
  };

  return (
    <NotificationProvider>
      <Container fluid>
        <AnimatePresence mode="wait">
          {!activeModule ? (
            <motion.div
              key="users-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Quick Stats */}
              <Row className="g-3 mb-4">
                {userModules.map(module => (
                  <Col key={module.id} md={4}>
                    <Card className="border-0 shadow-sm">
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                            <FontAwesomeIcon icon={module.icon} className="text-primary" />
                          </div>
                          <div>
                            <h6 className="text-secondary mb-1">{module.stats.label}</h6>
                            <h3 className="mb-0">{module.stats.value}</h3>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Module Cards */}
              <Row className="g-4">
                {userModules.map((module) => (
                  <Col key={module.id} md={4}>
                    <motion.div
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="h-100 border-0 shadow-sm cursor-pointer"
                        onClick={() => handleModuleClick(module.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body className="p-4">
                          <div className="d-flex align-items-center mb-3">
                            <div className="rounded-3 p-3 bg-primary bg-opacity-10 me-3">
                              <FontAwesomeIcon icon={module.icon} className="text-primary fs-4" />
                            </div>
                            <h5 className="mb-0">{module.title}</h5>
                          </div>
                          <p className="text-secondary mb-0">
                            {module.description}
                          </p>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          ) : (
            <motion.div
              key="active-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Button
                variant="light"
                className="mb-4"
                onClick={handleBack}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Back to Users
              </Button>
              {(() => {
                const ModuleComponent = userModules.find(m => m.id === activeModule)?.component;
                return ModuleComponent ? <ModuleComponent /> : null;
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </NotificationProvider>
  );
};

export default Users; 