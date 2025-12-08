// Major US cities
export const US_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
  'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'San Francisco', 'Charlotte',
  'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Detroit', 'Nashville',
  'Portland', 'Memphis', 'Oklahoma City', 'Las Vegas', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
  'Tucson', 'Fresno', 'Mesa', 'Sacramento', 'Atlanta', 'Kansas City', 'Colorado Springs', 'Miami',
  'Raleigh', 'Omaha', 'Long Beach', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington',
  'Tampa', 'New Orleans', 'Wichita', 'Cleveland', 'Bakersfield', 'Aurora', 'Anaheim', 'Honolulu',
  'Santa Ana', 'Riverside', 'Corpus Christi', 'Lexington', 'Stockton', 'Henderson', 'Saint Paul',
  'St. Louis', 'Cincinnati', 'Pittsburgh', 'Greensboro', 'Anchorage', 'Plano', 'Lincoln', 'Orlando',
  'Irvine', 'Newark', 'Toledo', 'Durham', 'Chula Vista', 'Fort Wayne', 'Jersey City', 'St. Petersburg',
  'Laredo', 'Madison', 'Chandler', 'Buffalo', 'Lubbock', 'Scottsdale', 'Reno', 'Glendale', 'Gilbert',
  'Winston-Salem', 'North Las Vegas', 'Norfolk', 'Chesapeake', 'Garland', 'Irving', 'Hialeah',
  'Fremont', 'Boise', 'Richmond', 'Baton Rouge', 'Spokane', 'Des Moines', 'Tacoma', 'San Bernardino',
  'Modesto', 'Fontana', 'Santa Clarita', 'Birmingham', 'Oxnard', 'Fayetteville', 'Moreno Valley',
  'Rochester', 'Glendale', 'Huntington Beach', 'Salt Lake City', 'Grand Rapids', 'Amarillo',
  'Yonkers', 'Aurora', 'Montgomery', 'Akron', 'Little Rock', 'Huntsville', 'Augusta', 'Port St. Lucie',
  'Grand Prairie', 'Columbus', 'Tallahassee', 'Overland Park', 'Tempe', 'McKinney', 'Mobile', 'Cape Coral',
  'Shreveport', 'Frisco', 'Knoxville', 'Worcester', 'Brownsville', 'Vancouver', 'Fort Lauderdale',
  'Sioux Falls', 'Ontario', 'Chattanooga', 'Providence', 'Newport News', 'Rancho Cucamonga', 'Santa Rosa',
  'Oceanside', 'Salem', 'Elk Grove', 'Garden Grove', 'Pembroke Pines', 'Peoria', 'Eugene', 'Corona',
  'Cary', 'Springfield', 'Fort Collins', 'Jackson', 'Alexandria', 'Hayward', 'Lancaster', 'Lakewood',
  'Clarksville', 'Palmdale', 'Salinas', 'Springfield', 'Hollywood', 'Pasadena', 'Sunnyvale', 'Macon',
  'Kansas City', 'Pomona', 'Escondido', 'Killeen', 'Naperville', 'Joliet', 'Bellevue', 'Rockford',
  'Savannah', 'Paterson', 'Torrance', 'Bridgeport', 'McAllen', 'Mesquite', 'Syracuse', 'Midland',
  'Pasadena', 'Murfreesboro', 'Miramar', 'Dayton', 'Fullerton', 'Olathe', 'Orange', 'Thornton',
  'Roseville', 'Denton', 'Waco', 'Surprise', 'Carrollton', 'West Valley City', 'Charleston',
  'Warren', 'Hampton', 'Gainesville', 'Visalia', 'Coral Springs', 'Columbia', 'Cedar Rapids',
  'Sterling Heights', 'New Haven', 'Stamford', 'Concord', 'Kent', 'Santa Clara', 'Elizabeth',
  'Round Rock', 'Thousand Oaks', 'Lafayette', 'Athens', 'Topeka', 'Simi Valley', 'Fargo',
  'Norman', 'Columbia', 'Abilene', 'Wilmington', 'Hartford', 'Victorville', 'Pearland', 'Vallejo',
  'Ann Arbor', 'Berkeley', 'Allentown', 'Richardson', 'Odessa', 'Arvada', 'Cambridge', 'Sugar Land',
];

// Major world cities
export const WORLD_CITIES = [
  'London', 'Paris', 'Tokyo', 'Dubai', 'Singapore', 'Hong Kong', 'Sydney', 'Melbourne', 'Toronto',
  'Vancouver', 'Montreal', 'Berlin', 'Munich', 'Frankfurt', 'Amsterdam', 'Brussels', 'Vienna',
  'Zurich', 'Geneva', 'Milan', 'Rome', 'Madrid', 'Barcelona', 'Lisbon', 'Dublin', 'Edinburgh',
  'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Leeds', 'Bristol', 'Copenhagen', 'Stockholm',
  'Oslo', 'Helsinki', 'Warsaw', 'Prague', 'Budapest', 'Athens', 'Istanbul', 'Moscow', 'St. Petersburg',
  'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Seoul', 'Osaka', 'Nagoya', 'Kyoto', 'Bangkok',
  'Kuala Lumpur', 'Jakarta', 'Manila', 'Ho Chi Minh City', 'Hanoi', 'Mumbai', 'Delhi', 'Bangalore',
  'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Cairo', 'Cape Town', 'Johannesburg', 'Lagos', 'Nairobi',
  'Casablanca', 'Tel Aviv', 'Jerusalem', 'Riyadh', 'Abu Dhabi', 'Doha', 'Kuwait City', 'Muscat',
  'São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Santiago', 'Lima', 'Bogotá', 'Mexico City',
  'Guadalajara', 'Monterrey', 'Panama City', 'San Juan', 'Auckland', 'Wellington', 'Perth', 'Brisbane',
  'Adelaide', 'Taipei', 'Macau', 'Colombo', 'Dhaka', 'Karachi', 'Lahore', 'Islamabad',
];

// All cities combined
export const ALL_CITIES = [...US_CITIES, ...WORLD_CITIES].sort();

// All countries
export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
  'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
  'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali',
  'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
  'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
  'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
  'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe',
];

// States and provinces worldwide
export const STATES_PROVINCES = [
  // US States
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
  // Canadian Provinces
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
  'Northwest Territories', 'Nunavut', 'Yukon',
  // Australian States
  'New South Wales', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
  'Australian Capital Territory', 'Northern Territory',
  // UK Regions
  'England', 'Scotland', 'Wales', 'Northern Ireland',
  // German States
  'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse',
  'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate',
  'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
  // Indian States
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Mexican States
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
  'Yucatán', 'Zacatecas',
  // Brazilian States
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Espírito Santo', 'Goiás', 'Maranhão',
  'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco',
  'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima',
  'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
  // Japanese Prefectures
  'Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Okinawa', 'Kanagawa', 'Aichi', 'Fukuoka', 'Hyogo',
  // Chinese Provinces
  'Guangdong', 'Shandong', 'Henan', 'Sichuan', 'Jiangsu', 'Hebei', 'Hunan', 'Anhui', 'Hubei',
  'Zhejiang', 'Fujian', 'Shaanxi', 'Shanxi', 'Liaoning', 'Jilin', 'Heilongjiang', 'Yunnan',
  'Guizhou', 'Gansu', 'Hainan', 'Jiangxi', 'Guangxi', 'Inner Mongolia', 'Tibet', 'Xinjiang',
  // French Regions
  'Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Occitanie', 'Nouvelle-Aquitaine', 'Auvergne-Rhône-Alpes',
  'Brittany', 'Normandy', 'Hauts-de-France', 'Grand Est', 'Pays de la Loire', 'Centre-Val de Loire',
  'Burgundy-Franche-Comté', 'Corsica',
  // Spanish Regions
  'Andalusia', 'Catalonia', 'Madrid', 'Valencia', 'Galicia', 'Castile and León', 'Basque Country',
  'Castile-La Mancha', 'Canary Islands', 'Murcia', 'Aragon', 'Extremadura', 'Balearic Islands',
  'Asturias', 'Navarre', 'Cantabria', 'La Rioja',
  // Italian Regions
  'Lombardy', 'Lazio', 'Campania', 'Sicily', 'Veneto', 'Emilia-Romagna', 'Piedmont', 'Tuscany',
  'Apulia', 'Calabria', 'Sardinia', 'Liguria', 'Marche', 'Abruzzo', 'Friuli Venezia Giulia',
  'Trentino-Alto Adige', 'Umbria', 'Basilicata', 'Molise', 'Valle d\'Aosta',
].sort();
