import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Path } from 'src/constants/enums';

/** Deep-link: /quotations/:id → list page with that quotation selected. */
const QuotationEditPage: React.FC = () => {
  const { id } = useParams();
  if (!id) return <Navigate to={Path.Quotations} replace />;
  return <Navigate to={`${Path.Quotations}?id=${id}`} replace />;
};

export default QuotationEditPage;
