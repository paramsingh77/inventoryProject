import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <motion.button
      className={`theme-toggle-btn ${darkMode ? 'dark' : 'light'}`}
      onClick={toggleDarkMode}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        padding: '12px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: darkMode ? '#ffffff' : '#000000',
        color: darkMode ? '#000000' : '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <FontAwesomeIcon icon={darkMode ? faSun : faMoon} size="lg" />
    </motion.button>
  );
};

export default ThemeToggle; 