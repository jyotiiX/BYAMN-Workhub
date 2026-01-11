// ... existing imports

const Auth = () => {
  // ... existing state and logic (searchParams, navigate, auth, toast, etc.)

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Navbar />
        <div className="bg-card rounded-2xl shadow-xl p-8 animate-scale-in">
          <div className="text-center mb-8">
            {/* ... Header content remains same ... */}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... Form Fields (fullName, email, password) remain same ... */}

            {/* UPDATED BUTTON: Using the new isLoading prop */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              isLoading={loading} 
            >
              {showForgotPassword
                ? 'Send Reset Link'
                : isLogin
                ? 'Sign In'
                : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {/* ... Bottom Links remain same ... */}
          </div>
        </div>

        {/* ... Footer text remains same ... */}
      </div>
      <Footer />
    </div>
  );
};

export default Auth;