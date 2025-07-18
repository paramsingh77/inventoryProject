import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMapMarkerAlt, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import AOS from 'aos';
import 'aos/dist/aos.css';
import logo from '../images/image copy.png';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
// Import Afacad font
const fontImport = document.createElement('style');
fontImport.textContent = `@import url('https://fonts.cdnfonts.com/css/afacad');`;
document.head.appendChild(fontImport);

// Add custom styles for button hover
const customStyles = document.createElement('style');
customStyles.textContent = `
    .view-inventory-btn {
        background-color: #0071e3;
        color: white;
        border-radius: 12px;
        padding: 12px;
        font-size: 0.95rem;
        font-weight: 500;
        border: none;
        transition: all 0.3s ease;
        width: 100%;
    }
    
    .view-inventory-btn:hover {
        background-color: #000000 !important;
        color: #ffffff !important;
        transform: scale(1.02);
    }
`;
document.head.appendChild(customStyles);

// Add API URL constant at the top of the file
const API_URL = 'http://localhost:2000/api';

const SitesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true
        });
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Check if user is admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }

        const fetchSites = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/sites`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch sites');
                }

                const data = await response.json();
                if (data.success) {
                    setSites(data.sites);
                } else {
                    throw new Error(data.message || 'Failed to fetch sites');
                }
            } catch (err) {
                console.error('Error fetching sites:', err);
                setError(err.message || 'An error occurred while fetching sites');
            } finally {
                setLoading(false);
            }
        };

        fetchSites();
    }, [user, navigate]);

    const allSites = [
        { Name: 'Dameron Hospital', Location: 'Stockton', Img: 'https://stocktonia.org/wp-content/uploads/2024/12/DSC06271.jpg', Avl:'' },
        { Name: 'American Advance Management', Location: 'Modesto', Img: 'https://americanam.org/wp-content/uploads/2023/07/Central-Valley-Specialty-Hospital_Nero-AI_Photo_x4-scaled-e1690750874409.jpg',Avl:''  },
        { Name: 'Phoenix Specilaty Hospital', Location: 'Phoenix', Img: 'https://lh3.googleusercontent.com/p/AF1QipOmz5HyLeSw43ZEL2Ouzn4cWtC_o5ZkUphutIrZ=s1360-w1360-h1020',Avl:''  },
        { Name: 'Centeral Valley Specialty Hospital', Location: '', Img: 'https://americanam.org/wp-content/uploads/2023/07/Central-Valley-Specialty-Hospital_Nero-AI_Photo_x4-scaled-e1690750874409.jpg',Avl:''  },
        { Name: 'Coalinga Regional Medical Center', Location: 'Coalinga', Img: 'https://americanam.org/wp-content/uploads/elementor/thumbs/Coalinga-Regional-Medical-Center_Nero-AI_Photo_x4-scaled-qa0jah66x6mj1mximu2kgyjzhntocced96046wjzhc.jpg',Avl:''  },
        { Name: 'Orchard Hospital', Location: '', Img: 'https://americanam.org/wp-content/uploads/elementor/thumbs/Orchard-Hospital_Nero-AI_Photo_x4-qa0h6gy0agku8rc1ghblcn1690g6xfnqgyxo6f90m8.jpg' ,Avl:'' },
        { Name: 'Gllen Medical Center', Location: 'Willows', Img: 'https://americanam.org/wp-content/uploads/2023/07/Glenn-Medical-Center_Nero-AI_Photo_x4-scaled.jpg',Avl:''  },
        { Name: 'Sonoma Specialty Hospital', Location: 'Sonoma', Img: 'https://americanam.org/wp-content/uploads/2023/07/DSC08734-1-550x632.jpg',Avl:''  },
        { Name: 'Kentfiled ', Location: 'San fransisco', Img: 'https://s3-media0.fl.yelpcdn.com/bphoto/iQ1h4GLOvcPGHK6rm7ta0w/ls.jpg',Avl:''  },
        { Name: 'Kentfiled ', Location: 'Marin', Img: 'https://americanam.org/wp-content/uploads/2023/11/Kentfield-Placeholder-500x400-1.jpg',Avl:'NOT'  },
        { Name: 'Aurora', Location: 'San Diego', Img: 'https://s3-media0.fl.yelpcdn.com/bphoto/JgntefB3ZUXQdfBr1b798g/l.jpg',Avl:''  },
        { Name: 'Salt Lake Specialty Hospital', Location: 'Salt Lake', Img: 'https://slspecialty.org/wp-content/uploads/2024/11/KPC-Promise-7-scaled.jpg',Avl:''  },
        { Name: 'Baton Rogue Specialty Hospital', Location: 'Lousiana', Img: 'https://americanam.org/wp-content/uploads/2024/06/Boutne-Rouge-Placeholder-500x400-1.jpg' ,Avl:'NOT' },
        { Name: 'Madera Community Hospital', Location: 'Madera', Img: 'https://www.fresnobee.com/latest-news/6khf7g/picture297774203/alternates/FREE_1140/Madera%20Community%20Hospital_12302024_2' ,Avl:'' },
        { Name: 'Colusa Medical Center', Location: "Colusa", Img: 'https://americanam.org/wp-content/uploads/elementor/thumbs/Colusa-Medical-Center_Nero-AI_Photo_x4-scaled-e1690430420567-qa0hb80mub30xsfjpj9oyfv2d50zucivsho1is7d5s.jpg' ,Avl:'' },
        { Name: 'Williams', Location: '', Img: 'https://stocktonia.org/wp-content/uploads/2024/12/DSC06271.jpg' ,Avl:'' },
        { Name: 'West Huschle', Location: '', Img: 'https://stocktonia.org/wp-content/uploads/2024/12/DSC06271.jpg' ,Avl:'' },
        { Name: 'Amarillo Specialty Hospital', Location: 'Amarillo', Img: 'https://americanam.org/wp-content/uploads/2024/06/Amarillo-Placeholder-500x400-1.jpg',Avl:'NOT'  },
    ];

    const filteredSites = allSites.filter(site => {
        const matchesSearch = site.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (site.Location && site.Location.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (user && user.assigned_location) {
            // Regular users only see their assigned location
            return matchesSearch && site.Name === user.assigned_location;
        }
        return false; // If no user or no assigned location, show nothing
    });

    const sortedSites = [...filteredSites.filter(site => !site.Avl), ...filteredSites.filter(site => site.Avl)];

    const afacadFont = {
        fontFamily: 'Afacad, sans-serif'
    };

    // Admin-only functions
    const handleEdit = (siteId) => {
        console.log('Editing site:', siteId);
    };

    const handleDelete = (siteId) => {
        console.log('Deleting site:', siteId);
    };

    const handleAddSite = () => {
        navigate('/add-site');
    };

    const handleSiteClick = (site) => {
        // Convert site name to URL-friendly format
        const urlSafeName = site.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        navigate(`/inventory/${urlSafeName}`, { 
            state: { siteId: site.id, siteName: site.name } 
        });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-4">
                <ThemeToggle />
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button 
                        className="btn btn-outline-danger ms-3"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100" style={afacadFont}>
            <ThemeToggle />
            {/* Updated Header Section */}
            <div className="bg-white shadow-sm py-3 mb-4">
                <div className="container">
                    <div className="row align-items-center g-3">
                        <div className="col-md-6">
                            <div className="d-flex align-items-center">
                                <img 
                                    src={logo} 
                                    alt="Logo" 
                                    className="me-3"
                                    style={{ 
                                        height: '40px',
                                        width: 'auto'
                                    }} 
                                />
                                <h1 className="h3 mb-0 fw-bold" style={afacadFont}>
                                    Facilities
                                </h1>
                            </div>
                        </div>
                        <div className="col-md-6 d-flex justify-content-end">
                            <div className="position-relative flex-grow-1">
                                <FontAwesomeIcon 
                                    icon={faSearch} 
                                    className="position-absolute text-muted"
                                    style={{ left: '15px', top: '12px' }} 
                                />
                                <input
                                    type="text"
                                    className="form-control form-control-lg ps-5 rounded-pill border-0 bg-light"
                                    placeholder="Search facilities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={afacadFont}
                                />
                            </div>
                            {user && user.role === 'admin' && (
                                <button 
                                    className="btn btn-primary ms-3 rounded-pill"
                                    onClick={handleAddSite}
                                >
                                    Add New Facility
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="container pb-5" style={{ maxWidth: '1140px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1>Hospital Sites</h1>
                        <span className="badge bg-primary">Total Sites: {sites.length}</span>
                    </div>
                    
                    {/* Updated to center the cards */}
                    <div className="row g-4 justify-content-center">
                        {sites.map((site) => (
                            <motion.div
                                key={site.id}
                                className="col-sm-6 col-lg-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{ y: -5 }}
                                style={{ maxWidth: '340px' }}
                            >
                                <div className="card h-100 border-0" 
                                    style={{ 
                                        borderRadius: '16px',
                                        backgroundColor: '#ffffff',
                                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
                                        transition: 'all 0.3s ease',
                                        width: '100%'
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <img 
                                            src={site.image_url} 
                                            className="card-img-top" 
                                            alt={site.name}
                                            style={{ 
                                                height: '180px',
                                                objectFit: 'cover',
                                                borderRadius: '16px 16px 0 0'
                                            }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                                            }}
                                        />
                                        {/* <div 
                                            style={{
                                                position: 'absolute',
                                                top: '16px',
                                                right: '16px',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                backgroundColor: site.is_active ? 'rgba(52, 199, 89, 0.9)' : 'rgba(255, 59, 48, 0.9)',
                                                color: 'white',
                                                fontSize: '0.85rem',
                                                fontWeight: '500',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)'
                                            }}
                                        >
                                           ÷ {site.is_active ? 'Active' : 'Inactive'}
                                        </div> */}
                                    </div>
                                    <div className="card-body p-4">
                                        <h5 className="card-title mb-2" style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: '600',
                                            color: '#1d1d1f'
                                        }}>
                                            {site.name}
                                        </h5>
                                        <p className="card-text mb-3" style={{ 
                                            color: '#86868b',
                                            fontSize: '0.95rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                                            {site.location || 'Location not specified'}
                                        </p>
                                        <button 
                                            className="view-inventory-btn"
                                            onClick={() => handleSiteClick(site)}
                                        >
                                            View Inventory
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {sites.length === 0 && (
                        <div className="text-center py-5">
                            <h3 style={{ color: '#86868b' }}>No sites found</h3>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default SitesPage