import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { HOME_FEATURE_ICONS } from '../constants/icons';

const Home = () => {
  const ManagementIcon = HOME_FEATURE_ICONS.management;
  const PrioritizationIcon = HOME_FEATURE_ICONS.prioritization;
  const CollaborationIcon = HOME_FEATURE_ICONS.collaboration;
  const AnalyticsIcon = HOME_FEATURE_ICONS.analytics;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-background-overlay text-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold mb-6">
            Ship the right features, faster
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-foreground-secondary">
            Prioritize your roadmap with team alignment and data-driven decisions
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-accent text-white hover:bg-accent-600">
                Get Started
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-background-elevated">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background-base">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-12 text-foreground">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-background-elevated rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ManagementIcon className="h-6 w-6 text-foreground-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Feature Request Management</h3>
                <p className="text-foreground-secondary">
                  Easily create, track, and manage feature requests in one place.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-background-elevated rounded-lg flex items-center justify-center mx-auto mb-4">
                  <PrioritizationIcon className="h-6 w-6 text-foreground-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Prioritization Tools</h3>
                <p className="text-foreground-secondary">
                  Use data-driven methods to prioritize features based on impact and effort.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-background-elevated rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CollaborationIcon className="h-6 w-6 text-foreground-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Team Collaboration</h3>
                <p className="text-foreground-secondary">
                  Collaborate with your team to evaluate and discuss feature requests.
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-background-elevated rounded-lg flex items-center justify-center mx-auto mb-4">
                  <AnalyticsIcon className="h-6 w-6 text-foreground-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Analytics Dashboard</h3>
                <p className="text-foreground-secondary">
                  Visualize feature request data with powerful analytics tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background-surface">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-12 text-foreground">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-background-elevated text-foreground-secondary rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-4">1</div>
              <h3 className="text-xl font-medium mb-2 text-foreground">Collect Requests</h3>
              <p className="text-foreground-secondary">
                Gather feature requests from customers, team members, and stakeholders in one central location.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-background-elevated text-foreground-secondary rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-4">2</div>
              <h3 className="text-xl font-medium mb-2 text-foreground">Analyze & Prioritize</h3>
              <p className="text-foreground-secondary">
                Score and rank features based on business value, user impact, and implementation effort.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-background-elevated text-foreground-secondary rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-4">3</div>
              <h3 className="text-xl font-medium mb-2 text-foreground">Plan & Execute</h3>
              <p className="text-foreground-secondary">
                Create roadmaps, assign tasks, and track progress as features move from idea to implementation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background-overlay text-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Ready to streamline your feature prioritization?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-foreground-secondary">
            Join FeatureForge today and start making better product decisions.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-accent text-white hover:bg-accent-600">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
