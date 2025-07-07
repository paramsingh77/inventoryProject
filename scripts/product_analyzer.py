import requests
from bs4 import BeautifulSoup
import pandas as pd
from typing import List, Dict, Optional
import logging
from datetime import datetime
import json
import os
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/product_analyzer.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class Product:
    name: str
    price: float
    rating: float
    reviews_count: int
    url: str
    source: str
    availability: bool
    specifications: Dict[str, str]
    last_updated: datetime

class ProductAnalyzer:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.sources = {
            'amazon': 'https://www.amazon.com/s?k={}',
            'newegg': 'https://www.newegg.com/p/pl?d={}',
            'bestbuy': 'https://www.bestbuy.com/site/searchpage.jsp?st={}'
        }
        
    def search_product(self, query: str) -> List[Product]:
        """
        Search for a product across multiple sources and return the best matches.
        """
        products = []
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_source = {
                executor.submit(self._search_source, source, query): source 
                for source in self.sources.keys()
            }
            
            for future in future_to_source:
                try:
                    source_products = future.result()
                    products.extend(source_products)
                except Exception as e:
                    logger.error(f"Error searching {future_to_source[future]}: {str(e)}")
        
        return self._rank_products(products)

    def _search_source(self, source: str, query: str) -> List[Product]:
        """
        Search for products on a specific source.
        """
        try:
            url = self.sources[source].format(query.replace(' ', '+'))
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            if source == 'amazon':
                return self._parse_amazon(response.text)
            elif source == 'newegg':
                return self._parse_newegg(response.text)
            elif source == 'bestbuy':
                return self._parse_bestbuy(response.text)
            
        except Exception as e:
            logger.error(f"Error searching {source}: {str(e)}")
            return []

    def _rank_products(self, products: List[Product]) -> List[Product]:
        """
        Rank products based on price, rating, and review count.
        """
        if not products:
            return []
            
        # Convert to DataFrame for easier analysis
        df = pd.DataFrame([vars(p) for p in products])
        
        # Normalize metrics
        df['price_score'] = 1 - (df['price'] - df['price'].min()) / (df['price'].max() - df['price'].min())
        df['rating_score'] = df['rating'] / 5.0
        df['review_score'] = df['reviews_count'] / df['reviews_count'].max()
        
        # Calculate final score (adjust weights as needed)
        df['final_score'] = (
            df['price_score'] * 0.4 +  # Price weight
            df['rating_score'] * 0.4 +  # Rating weight
            df['review_score'] * 0.2    # Review count weight
        )
        
        # Sort by final score
        df = df.sort_values('final_score', ascending=False)
        
        # Convert back to Product objects
        return [Product(**row) for row in df.to_dict('records')]

    def _parse_amazon(self, html: str) -> List[Product]:
        """
        Parse Amazon search results.
        """
        products = []
        soup = BeautifulSoup(html, 'html.parser')
        
        for item in soup.select('div[data-component-type="s-search-result"]'):
            try:
                name = item.select_one('h2 span').text.strip()
                price_elem = item.select_one('span.a-price-whole')
                price = float(price_elem.text.replace(',', '')) if price_elem else None
                
                rating_elem = item.select_one('span.a-icon-alt')
                rating = float(rating_elem.text.split(' ')[0]) if rating_elem else 0.0
                
                reviews_elem = item.select_one('span.a-size-base')
                reviews_count = int(reviews_elem.text.replace(',', '')) if reviews_elem else 0
                
                url = 'https://www.amazon.com' + item.select_one('h2 a')['href']
                
                if price and name:
                    products.append(Product(
                        name=name,
                        price=price,
                        rating=rating,
                        reviews_count=reviews_count,
                        url=url,
                        source='amazon',
                        availability=True,
                        specifications={},
                        last_updated=datetime.now()
                    ))
            except Exception as e:
                logger.error(f"Error parsing Amazon product: {str(e)}")
                continue
                
        return products

    def _parse_newegg(self, html: str) -> List[Product]:
        """
        Parse Newegg search results.
        """
        # Similar implementation for Newegg
        # This is a placeholder - implement actual parsing logic
        return []

    def _parse_bestbuy(self, html: str) -> List[Product]:
        """
        Parse Best Buy search results.
        """
        # Similar implementation for Best Buy
        # This is a placeholder - implement actual parsing logic
        return []

    def get_product_details(self, url: str) -> Optional[Product]:
        """
        Get detailed information about a specific product.
        """
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            # Implement detailed product parsing logic here
            # This would extract full specifications, detailed pricing, etc.
            
            return None  # Placeholder
            
        except Exception as e:
            logger.error(f"Error getting product details: {str(e)}")
            return None

    def save_results(self, products: List[Product], filename: str):
        """
        Save search results to a JSON file.
        """
        try:
            data = [vars(p) for p in products]
            data = [{**d, 'last_updated': d['last_updated'].isoformat()} for d in data]
            
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error saving results: {str(e)}")

def main():
    analyzer = ProductAnalyzer()
    
    # Example usage
    query = "gaming laptop"
    products = analyzer.search_product(query)
    
    # Save results
    analyzer.save_results(products, f'results/{query.replace(" ", "_")}_{int(time.time())}.json')
    
    # Print top 5 results
    for i, product in enumerate(products[:5], 1):
        print(f"\n{i}. {product.name}")
        print(f"Price: ${product.price:.2f}")
        print(f"Rating: {product.rating}/5.0 ({product.reviews_count} reviews)")
        print(f"Source: {product.source}")
        print(f"URL: {product.url}")

if __name__ == "__main__":
    main() 