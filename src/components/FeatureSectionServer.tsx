import { Heart, Shield, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeaturesSectionServer() {
  const features = [
    {
      icon: Heart,
      title: "Memory Gallery",
      description:
        "Share unlimited photos, videos, and cherished memories in a beautifully organized collection that tells the complete story of your loved one's life journey and special moments captured over time.",
    },
    {
      icon: Shield,
      title: "Tribute Wall",
      description:
        "Allow friends and family to share heartfelt messages, stories, and condolences in a dedicated space that creates a lasting record of love and support during difficult times.",
    },
    {
      icon: Users,
      title: "Family Collaboration",
      description:
        "Enable multiple family members to contribute content, manage the memorial, and work together to create a comprehensive tribute that honors your loved one's memory.",
    },
    {
      icon: Clock,
      title: "Timeline of Life",
      description:
        "Create a chronological timeline showcasing important milestones, achievements, and special moments that celebrate the full journey of your loved one's life.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-6">
            Compassionate Features
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Everything you need to create a beautiful, lasting tribute that brings people together
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={cn(
                "group hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20",
                "bg-card/50 backdrop-blur-sm"
              )}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
