import { SalaryPredictor as SalaryPredictorComponent } from "@/components/SalaryPredictor";
import { Navbar } from "@/components/Navbar";
import { useTranslation } from "react-i18next";

const SalaryPredictor = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{t("Salary Predictor")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("Use our AI-powered salary predictor to estimate what you could earn based on your experience, location, and skills. This tool uses market data to provide a realistic salary range for your profile.")}
          </p>
          <SalaryPredictorComponent />
        </div>
      </div>
    </div>
  );
};

export default SalaryPredictor; 