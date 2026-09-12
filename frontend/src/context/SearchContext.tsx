import React, { createContext, useContext, useState } from 'react';

export interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return ctx;
};
