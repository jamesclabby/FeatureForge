import React from 'react';
import { Card } from '../components/ui/card';
import SignUp from '../components/auth/SignUp';

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <SignUp />
      </Card>
    </div>
  );
};

export default SignUpPage; 