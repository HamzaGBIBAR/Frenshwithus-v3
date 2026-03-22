import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description = "Learn French with ease! Join FrenchWithUs for interactive live sessions and comprehensive courses.",
  name = "FrenchWithUs",
  type = "website"
}) {
  return (
    <Helmet>
      { /* Standard metadata tags */ }
      <title>{title ? `${title} | FrenchWithUs` : 'FrenchWithUs - Learn French Online'}</title>
      <meta name='description' content={description} />
      
      { /* OpenGraph tags */ }
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title ? `${title} | FrenchWithUs` : 'FrenchWithUs'} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />
      
      { /* Twitter tags */ }
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content={type} />
      <meta name="twitter:title" content={title ? `${title} | FrenchWithUs` : 'FrenchWithUs'} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
