import csv
import sys
from typing import Dict, Tuple

def load_college_info(filepath: str) -> Dict[str, Tuple[str, str]]:
    """Load college information into a dictionary for fast lookup."""
    college_info = {}
    
    with open(filepath, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            college_id = row['college_id']
            status = row['status']
            home_university = row['home_university']
            college_info[college_id] = (status, home_university)
    
    return college_info

def extract_college_id(college_code: str) -> str:
    """Extract college ID from college code by removing leading zeros."""
    return str(int(college_code))

def process_cutoffs(input_file: str, output_file: str, college_info: Dict[str, Tuple[str, str]]):
    """Process combined cutoffs CSV and add college information."""
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames + ['status', 'home_university']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        
        writer.writeheader()
        
        for row in reader:
            college_code = row['college_code']
            college_id = extract_college_id(college_code)
            
            if college_id in college_info:
                status, home_university = college_info[college_id]
                row['status'] = status
                row['home_university'] = home_university
            else:
                row['status'] = 'Unknown'
                row['home_university'] = 'Unknown'
                print(f"Warning: College ID {college_id} not found in college_information.csv")
            
            writer.writerow(row)

def main():
    college_info_file = 'college_information.csv'
    combined_cutoffs_file = 'combined_cutoffs.csv'
    output_file = 'combined_cutoffs_with_info.csv'
    
    print("Loading college information...")
    college_info = load_college_info(college_info_file)
    print(f"Loaded {len(college_info)} colleges")
    
    print("Processing combined cutoffs...")
    process_cutoffs(combined_cutoffs_file, output_file, college_info)
    
    print(f"Complete! Output saved to {output_file}")

if __name__ == "__main__":
    main()
