import UserForm from "@/components/user-form"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">君はAIを論破できる？</h1>
          <p className="text-muted-foreground">
            AIと議論して、論理的思考力を試してみましょう
          </p>
        </div>
        <UserForm />
      </div>
    </div>
  )
}
