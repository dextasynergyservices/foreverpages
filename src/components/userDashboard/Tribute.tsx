"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Check, X, Clock, Heart, Flag } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";

interface Tribute {
  id: number;
  author: string;
  email: string;
  message: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "flagged";
}

const Tributes = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const [tributes, setTributes] = useState<Tribute[]>([
    {
      id: 1,
      author: "Michael Chen",
      email: "michael@email.com",
      message:
        "Sarah was an incredible person who touched so many lives. Her kindness and warmth will never be forgotten. She always had a smile and a helping hand for anyone in need.",
      date: "2024-01-15",
      status: "pending",
    },
    {
      id: 2,
      author: "Emma Rodriguez",
      email: "emma@email.com",
      message:
        "I have so many wonderful memories of Sarah from our college days. She was the friend who would drop everything to help you move, study for exams, or just listen when you needed someone to talk to.",
      date: "2024-01-14",
      status: "approved",
    },
    {
      id: 3,
      author: "David Thompson",
      email: "david@email.com",
      message:
        "Sarah was my mentor at work and became a dear friend. Her guidance helped shape my career, but more importantly, her example taught me how to be a better person.",
      date: "2024-01-13",
      status: "approved",
    },
    {
      id: 4,
      author: "Anonymous User",
      email: "anonymous@temp.com",
      message:
        "This message contains inappropriate content that needs to be reviewed by the moderation team.",
      date: "2024-01-12",
      status: "flagged",
    },
  ]);

  const getStatusColor = (status: Tribute["status"]) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      case "flagged":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: Tribute["status"]) => {
    switch (status) {
      case "approved":
        return Check;
      case "pending":
        return Clock;
      case "rejected":
        return X;
      case "flagged":
        return Flag;
      default:
        return MessageSquare;
    }
  };

  const approveTribute = (id: number) => {
    setTributes(
      tributes.map((tribute) => (tribute.id === id ? { ...tribute, status: "approved" } : tribute))
    );
  };

  const rejectTribute = (id: number) => {
    setTributes(
      tributes.map((tribute) => (tribute.id === id ? { ...tribute, status: "rejected" } : tribute))
    );
  };

  const flagTribute = (id: number) => {
    setTributes(
      tributes.map((tribute) => (tribute.id === id ? { ...tribute, status: "flagged" } : tribute))
    );
  };

  const pendingCount = tributes.filter((t) => t.status === "pending").length;
  const approvedCount = tributes.filter((t) => t.status === "approved").length;
  const flaggedCount = tributes.filter((t) => t.status === "flagged").length;

  const cardBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-black" : "bg-white";
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const activeTabClasses =
    theme === "dark"
      ? "data-[state=active]:bg-white data-[state=active]:text-black"
      : "data-[state=active]:bg-black data-[state=active]:text-white";

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            {t("dashboard.tributes.title")}
          </h1>
          <p className={`mt-2 ${textMuted}`}>{t("dashboard.tributes.subtitle")}</p>
        </div>
        <div className="flex gap-4">
          <Card className={`p-4 border ${cardBorder} ${cardBg}`}>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <div className={`text-sm ${textMuted}`}>{t("dashboard.tributes.tabs.approved")}</div>
          </Card>
          <Card className={`p-4 border ${cardBorder} ${cardBg}`}>
            <div className="text-2xl font-bold text-secondary">{pendingCount}</div>
            <div className={`text-sm ${textMuted}`}>{t("dashboard.tributes.tabs.pending")}</div>
          </Card>
          {flaggedCount > 0 && (
            <Card className={`p-4 border ${cardBorder} ${cardBg}`}>
              <div className="text-2xl font-bold text-destructive">{flaggedCount}</div>
              <div className={`text-sm ${textMuted}`}>{t("dashboard.tributes.tabs.flagged")}</div>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:flex md:gap-2 md:overflow-visible">
          <TabsTrigger
            value="pending"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap relative ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.pending")}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.approved")}
          </TabsTrigger>
          <TabsTrigger
            value="flagged"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.flagged")}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.all")}
          </TabsTrigger>
        </TabsList>
        {/* Spacer on small screens to prevent tabs overlapping content when grid rows are taller */}
        <div className="h-12 md:hidden" aria-hidden />

        <TabsContent value="pending" className="space-y-4">
          {tributes
            .filter((t) => t.status === "pending")
            .map((tribute) => (
              <Card key={tribute.id} className={`border ${cardBorder} ${cardBg}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback
                          className={theme === "dark" ? "bg-white/10" : "bg-gray-100"}
                        >
                          {tribute.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tribute.author}</h3>
                          <Badge variant={getStatusColor(tribute.status)}>{tribute.status}</Badge>
                        </div>
                        <p className={`text-sm ${textMuted}`}>
                          {tribute.email} • {tribute.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed mb-4">{tribute.message}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="memorial" size="sm" onClick={() => approveTribute(tribute.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      {t("dashboard.tributes.actions.approve")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => rejectTribute(tribute.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t("dashboard.tributes.actions.reject")}
                    </Button>
                    <Button
                      variant={theme === "dark" ? "memorial-ghost" : "outline"}
                      size="sm"
                      onClick={() => flagTribute(tribute.id)}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      {t("dashboard.tributes.actions.flag")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          {tributes.filter((t) => t.status === "pending").length === 0 && (
            <Card className={`border ${cardBorder} ${cardBg}`}>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-60" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("dashboard.tributes.empty.noPending")}
                </h3>
                <p className={textMuted}>{t("dashboard.tributes.empty.allReviewed")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {tributes
            .filter((t) => t.status === "approved")
            .map((tribute) => (
              <Card key={tribute.id} className={`border ${cardBorder} ${cardBg}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback
                          className={theme === "dark" ? "bg-white/10" : "bg-gray-100"}
                        >
                          {tribute.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tribute.author}</h3>
                          <Badge variant="default">
                            <Heart className="h-3 w-3 mr-1" />
                            {t("dashboard.tributes.live")}
                          </Badge>
                        </div>
                        <p className={`text-sm ${textMuted}`}>{tribute.date}</p>
                      </div>
                    </div>
                    <Button variant={theme === "dark" ? "memorial-ghost" : "outline"} size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{tribute.message}</p>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          {tributes
            .filter((t) => t.status === "flagged")
            .map((tribute) => (
              <Card key={tribute.id} className={`border ${cardBorder} ${cardBg}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-white/10">
                          {tribute.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tribute.author}</h3>
                          <Badge variant="destructive">
                            <Flag className="h-3 w-3 mr-1" />
                            {t("dashboard.tributes.tabs.flagged")}
                          </Badge>
                        </div>
                        <p className={`text-sm ${textMuted}`}>
                          {tribute.email} • {tribute.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed mb-4">{tribute.message}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="memorial" size="sm" onClick={() => approveTribute(tribute.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      {t("dashboard.tributes.actions.approve")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => rejectTribute(tribute.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t("dashboard.tributes.actions.reject")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {tributes.map((tribute) => {
            const StatusIcon = getStatusIcon(tribute.status);
            return (
              <Card key={tribute.id} className={`border ${cardBorder} ${cardBg}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback
                          className={theme === "dark" ? "bg-white/10" : "bg-gray-100"}
                        >
                          {tribute.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tribute.author}</h3>
                          <Badge variant={getStatusColor(tribute.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {tribute.status}
                          </Badge>
                        </div>
                        <p className={`text-sm ${textMuted}`}>
                          {tribute.email} • {tribute.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{tribute.message}</p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tributes;
