import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMapMarkerAlt, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import AOS from 'aos';
import 'aos/dist/aos.css';
import logo from '../../images/image copy.png';
// Import Afacad font
const fontImport = document.createElement('style');
fontImport.textContent = `@import url('https://fonts.cdnfonts.com/css/afacad');`;
document.head.appendChild(fontImport);

// Temporary logo placeholder


const SitesPage = () => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

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
        
        if (isAdmin && isAdmin()) {
            return matchesSearch; // Admin sees all sites that match search
        } else if (user && user.assigned_location) {
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
        if (!isAdmin()) return;
        // Add edit functionality
        console.log('Editing site:', siteId);
    };

    const handleDelete = (siteId) => {
        if (!isAdmin()) return;
        // Add delete functionality
        console.log('Deleting site:', siteId);
    };

    const handleAddSite = () => {
        if (!isAdmin()) return;
        // Navigate to add site page
        navigate('/add-site');
    };

    // If still loading user data, show loading state
    if (!user) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100" style={afacadFont}>
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
                            {isAdmin() && (
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
            <div className="container pb-5">
                <div className="row g-4">
                    {sortedSites.map((site, index) => (
                        <div 
                            key={index} 
                            className="col-md-6 col-lg-4 col-xl-3"
                            data-aos="fade-up"
                            data-aos-delay={index * 100}
                        >
                            <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                                <div className="position-relative">
                                    <img
                                        src={site.Img}
                                        className="card-img-top"
                                        alt={site.Name}
                                        style={{
                                            height: '200px',
                                            objectFit: 'cover',
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onMouseOver={e => e.target.style.transform = 'scale(1.1)'}
                                        onMouseOut={e => e.target.style.transform = 'scale(1.0)'}
                                    />
                                    {site.Avl && (
                                        <span className="position-absolute top-0 end-0 m-3 badge bg-danger rounded-pill" style={afacadFont}>
                                            Currently Unavailable
                                        </span>
                                    )}
                                </div>
                                <div className="card-body">
                                    <h5 className="card-title mb-2 fw-bold" style={afacadFont}>
                                        {site.Name}
                                    </h5>
                                    <p className="card-text mb-2" style={afacadFont}>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary me-2" />
                                        <small className="text-muted">{site.Location || "Location not available"}</small>
                                    </p>
                                    <p className="card-text small text-muted" style={afacadFont}>
                                        {site.Description}
                                    </p>
                                </div>
                                <div className="card-footer bg-white border-0 pt-0">
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-outline-primary flex-grow-1 rounded-pill"
                                            onClick={() => navigate(`/inventory/${site.Name}`)}
                                        >
                                            View Inventory
                                        </button>
                                        {isAdmin() && (
                                            <>
                                                <button 
                                                    className="btn btn-outline-secondary rounded-circle"
                                                    onClick={() => handleEdit(index)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button 
                                                    className="btn btn-outline-danger rounded-circle"
                                                    onClick={() => handleDelete(index)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SitesPage; 