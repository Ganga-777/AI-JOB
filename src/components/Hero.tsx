import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Briefcase, Target, Award, Sparkles } from "lucide-react";

export const Hero = () => {
  const { user } = useAuth();

  return (
    <div className="relative isolate overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-purple-500 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <a href="#" className="inline-flex space-x-6">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold leading-6 text-primary ring-1 ring-inset ring-primary/20">
                What's new
              </span>
              <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-gray-600">
                <span>Just shipped v1.0</span>
                <Sparkles className="h-4 w-4 text-primary" />
              </span>
            </a>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Your AI-Powered Career Navigator
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Transform your job search with AI-driven insights. Get personalized job matches, 
            interview preparation, and career guidance all in one place.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            {user ? (
              <Link to="/jobs">
                <Button size="lg" className="gap-2">
                  Find Jobs <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to="/interview" className="text-sm font-semibold leading-6 text-gray-900">
              Try AI Interview <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Feature list */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex gap-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Smart Job Matching</h3>
                <p className="mt-2 text-gray-600">AI-powered job recommendations based on your skills and preferences</p>
              </div>
            </div>
            <div className="flex gap-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Resume Analysis</h3>
                <p className="mt-2 text-gray-600">Get instant feedback on your resume with our ATS scanner</p>
              </div>
            </div>
            <div className="flex gap-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Skill Assessment</h3>
                <p className="mt-2 text-gray-600">Evaluate your skills and get personalized improvement suggestions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero image/illustration */}
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <img
              src="/hero-illustration.svg"
              alt="AI Job Navigator Interface"
              className="w-[76rem] rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};