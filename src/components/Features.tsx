import { Brain, Target, FileText, MessageSquare, Award, Briefcase, DollarSign, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation();

const features = [
  {
      name: t("AI-Powered Job Matching"),
      description: t("Our advanced AI algorithms analyze your skills, experience, and preferences to find the perfect job opportunities that match your profile."),
    icon: Target,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
      link: "/jobs"
  },
  {
      name: t("ATS-Friendly Resume Builder"),
      description: t("Create professional, ATS-optimized resumes with our intuitive builder. Choose from multiple templates and get real-time feedback to maximize your chances of getting noticed."),
    icon: FileEdit,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
      link: "/resume-builder"
  },
  {
      name: t("Smart Resume Analysis"),
      description: t("Get instant feedback on your resume with our ATS scanner. Optimize your resume for better visibility and higher response rates."),
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-50",
      link: "/profile"
  },
  {
      name: t("AI Interview Practice"),
      description: t("Practice interviews with our AI avatar. Get real-time feedback on your responses and improve your interview skills."),
    icon: MessageSquare,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
      link: "/interview"
  },
  {
      name: t("Salary Predictor"),
      description: t("Estimate your market value with our AI-powered salary predictor. Make informed decisions based on your experience, skills, and location."),
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      link: "/salary-predictor"
    },
    {
      name: t("Skill Assessment"),
      description: t("Evaluate your technical and soft skills through our comprehensive assessment tools. Identify areas for improvement and track your progress."),
    icon: Award,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
      link: "/jobs"
  },
  {
      name: t("Career Development"),
      description: t("Access personalized career development resources, including learning paths, industry insights, and growth opportunities."),
    icon: Brain,
    color: "text-red-500",
    bgColor: "bg-red-50",
      link: "/jobs"
  },
];

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">
            {t("Comprehensive Career Tools")}
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("Everything you need to succeed in your job search")}
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t("Our AI-powered platform provides all the tools and resources you need to navigate your career journey successfully.")}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <div className={`rounded-lg ${feature.bgColor} dark:bg-opacity-20 p-2`}>
                    <feature.icon className={`h-5 w-5 ${feature.color}`} aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <Link
                      to={feature.link}
                      className="text-sm font-semibold leading-6 text-primary"
                    >
                      {t("Learn more")} <span aria-hidden="true">→</span>
                    </Link>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-16 flex justify-center">
          <Link to="/login">
            <Button size="lg" className="gap-2">
              {t("Get Started Today")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export { Features };