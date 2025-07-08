import React from 'react';
import { Card } from '../components/ui/card';
import ResetPassword from '../components/auth/ResetPassword';

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <ResetPassword />
      </Card>
    </div>
  );
};

export default ResetPasswordPage; 