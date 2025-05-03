"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Brain, 
  Users,
  ArrowRight,
  Trophy,
  Crown,
  MessageCircle,
  Sparkles,
  Star,
  Zap,
} from "lucide-react"

const FeatureCard = ({ icon: Icon, title, description, className }: { 
  icon: any, 
  title: string, 
  description: string,
  className?: string 
}) => {
  const containerVariants = {
    initial: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  }

  const iconVariants = {
    initial: { scale: 0.5, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    },
    hover: {
      rotate: 360,
      transition: {
        duration: 0.7,
        ease: "easeInOut"
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={cn(
        "p-6 rounded-xl backdrop-blur-sm transition-all duration-300",
        "border border-border/50",
        "bg-gradient-to-br from-card/30 via-card/50 to-card/30",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        "group cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-4 mb-3">
        <motion.div 
          variants={iconVariants}
          className={cn(
            "p-2 rounded-lg transition-all duration-300",
            "bg-primary/10 group-hover:bg-primary/20",
            "text-primary"
          )}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  )
}

const ModeCard = ({ 
  href,
  icon: Icon,
  title,
  description,
  actionText,
  gradient,
}: {
  href: string
  icon: any
  title: string
  description: string
  actionText: string
  gradient: string
}) => {
  const containerVariants = {
    initial: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  }

  const iconVariants = {
    initial: { scale: 0.5, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    },
    hover: {
      rotate: 15,
      scale: 1.1,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  }

  const glowVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 0 },
    hover: { 
      opacity: 0.7,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="relative group cursor-pointer"
    >
      <Link href={href} className="block">
        <motion.div
          variants={glowVariants}
          className={cn(
            "absolute inset-0 rounded-2xl blur-xl",
            gradient
          )}
        />
        <Card className={cn(
          "relative overflow-hidden border-2 border-transparent",
          "hover:border-primary/50 transition-all duration-300",
          "bg-gradient-to-br from-card/90 via-card to-card/90"
        )}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div
                variants={iconVariants}
                className={cn(
                  "p-3 rounded-full",
                  "bg-gradient-to-br from-primary/20 to-primary/5",
                  "text-primary",
                  "transition-all duration-300",
                  "group-hover:shadow-lg group-hover:shadow-primary/10"
                )}
              >
                <Icon className="w-8 h-8" />
              </motion.div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                {title}
              </h3>
              <p className="text-muted-foreground">
                {description}
              </p>
              <Button
                variant="ghost"
                className="group/button relative overflow-hidden"
              >
                <motion.span
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  className="relative z-10 flex items-center gap-2"
                >
                  {actionText}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/button:translate-x-1" />
                </motion.span>
                <div className="absolute inset-0 bg-primary/10 translate-y-[101%] group-hover/button:translate-y-0 transition-transform duration-300" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export default function Home() {
  const headerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const titleVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.2
      }
    }
  }

  const subtitleVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.4
      }
    }
  }

  const decorationVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.6
      }
    }
  }

  return (
    <motion.main 
      className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/50 -z-10" />
      <div className="fixed inset-0 bg-grid-white/[0.02] -z-10" />
      
      {/* ヘッダー部分 */}
      <motion.div 
        variants={headerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-6xl mx-auto mb-12 text-center relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
          <motion.div
            variants={decorationVariants}
            className="absolute top-0 left-1/4 -translate-x-1/2 -translate-y-1/2"
          >
            <Star className="w-6 h-6 text-primary/20" />
          </motion.div>
          <motion.div
            variants={decorationVariants}
            className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2"
          >
            <Sparkles className="w-8 h-8 text-primary/20" />
          </motion.div>
          <motion.div
            variants={decorationVariants}
            className="absolute bottom-0 left-1/3 -translate-x-1/2 translate-y-1/2"
          >
            <Zap className="w-7 h-7 text-primary/20" />
          </motion.div>
        </div>

        <motion.div variants={titleVariants}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              AIロンパ
            </span>
          </h1>
        </motion.div>

        <motion.p
          variants={subtitleVariants}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-4"
        >
          AIと知的な議論を楽しもう。あなたの論理的思考力が試される場所です。
        </motion.p>
      </motion.div>

      {/* メインコンテンツ */}
      <div className="w-full max-w-6xl mx-auto">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4"
          initial="initial"
          animate="animate"
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* ユーザーvsAIモード */}
          <ModeCard
            href="/user-vs-ai"
            icon={Users}
            title="ユーザー vs AI"
            description="AIと一対一で議論を行い、あなたの論理的思考力を試してみましょう。勝利すれば名誉の殿堂入りも夢ではありません。"
            actionText="挑戦する"
            gradient="bg-gradient-to-br from-blue-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100"
          />

          {/* AIvsAIモード */}
          <ModeCard
            href="/ai-vs-ai"
            icon={Brain}
            title="AI vs AI"
            description="2つのAIが異なる立場で議論を展開。AIの思考プロセスを観察して、あなたの議論スキル向上に役立てましょう。"
            actionText="観戦する"
            gradient="bg-gradient-to-br from-green-500/30 to-yellow-500/30 opacity-0 group-hover:opacity-100"
          />

          {/* 特徴説明セクション */}
          <motion.div
            className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          >
            <FeatureCard
              icon={MessageCircle}
              title="自然な対話"
              description="最新のAI技術により、まるで人間と話しているような自然な議論が可能です。"
            />
            <FeatureCard
              icon={Trophy}
              title="実力の証明"
              description="AIに勝利すると名誉の殿堂入り。あなたの論理的思考力が認められます。"
            />
            <FeatureCard
              icon={Crown}
              title="スキル向上"
              description="AIとの議論を通じて、論理的思考力とディベートスキルが向上します。"
            />
          </motion.div>

          {/* 名誉の殿堂へのリンク */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="md:col-span-2 flex justify-center mt-8"
          >
            <Link href="/hall-of-fame">
              <Button
                variant="outline"
                className="group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  名誉の殿堂を見る
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-primary/5 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-300" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.main>
  )
}
