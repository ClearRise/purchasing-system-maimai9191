import React from 'react';
import { Navigate } from 'react-router-dom';
import { Path } from 'src/constants/enums';

const CustomersPage: React.FC = () => <Navigate to={Path.Stores} replace />;

export default CustomersPage;
