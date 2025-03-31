"use client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { cn } from "../../utils/cn";

export const HoverEffect = ({ items, className, onTabChange, activeTab }) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-4",
        className
      )}
    >
      {items.map((item) => (
        <motion.button
          onClick={() => onTabChange(item.id)}
          key={item.id}
          className={cn(
            "relative group flex flex-col items-center justify-center px-4 py-3 rounded-xl",
            "transition-all duration-300 ease-out",
            activeTab === item.id
              ? "bg-zinc-900 dark:bg-zinc-100"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FontAwesomeIcon
            icon={item.icon}
            className={cn(
              "w-6 h-6 mb-2 transition-colors",
              activeTab === item.id
                ? "text-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            )}
          />
          <h3
            className={cn(
              "font-medium transition-colors",
              activeTab === item.id
                ? "text-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            )}
          >
            {item.title}
          </h3>
          <p
            className={cn(
              "text-xs transition-colors",
              activeTab === item.id
                ? "text-zinc-300 dark:text-zinc-600"
                : "text-zinc-500 dark:text-zinc-500"
            )}
          >
            {item.description}
          </p>
        </motion.button>
      ))}
    </div>
  );
}; 