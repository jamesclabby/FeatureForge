import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to FeatureForge
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-primary-100">
            The ultimate tool for managing and prioritizing product feature requests
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Get Started
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-800">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-secondary-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-secondary-900">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-4 text-primary-500 mx-auto">📝</div>
                <h3 className="text-xl font-semibold mb-2 text-secondary-900">Feature Request Management</h3>
                <p className="text-secondary-600">
                  Easily create, track, and manage feature requests in one place.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-4 text-primary-500 mx-auto">🔍</div>
                <h3 className="text-xl font-semibold mb-2 text-secondary-900">Prioritization Tools</h3>
                <p className="text-secondary-600">
                  Use data-driven methods to prioritize features based on impact and effort.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-4 text-primary-500 mx-auto">👥</div>
                <h3 className="text-xl font-semibold mb-2 text-secondary-900">Team Collaboration</h3>
                <p className="text-secondary-600">
                  Collaborate with your team to evaluate and discuss feature requests.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-4 text-primary-500 mx-auto">📊</div>
                <h3 className="text-xl font-semibold mb-2 text-secondary-900">Analytics Dashboard</h3>
                <p className="text-secondary-600">
                  Visualize feature request data with powerful analytics tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-secondary-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2 text-secondary-900">Collect Requests</h3>
              <p className="text-secondary-600">
                Gather feature requests from customers, team members, and stakeholders in one central location.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2 text-secondary-900">Analyze & Prioritize</h3>
              <p className="text-secondary-600">
                Score and rank features based on business value, user impact, and implementation effort.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2 text-secondary-900">Plan & Execute</h3>
              <p className="text-secondary-600">
                Create roadmaps, assign tasks, and track progress as features move from idea to implementation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to streamline your feature prioritization?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-100">
            Join FeatureForge today and start making better product decisions.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 