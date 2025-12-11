/**
 * How It Works Page - JFGI Edition
 * Explain the game in a sarcastic way
 */
import { motion } from 'framer-motion';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: '🔗',
      title: 'Create a Link',
      description: 'Paste any URL you want someone to find. Like, literally anything on the internet.',
      gradient: 'from-pink-600 to-purple-600',
    },
    {
      icon: '🎯',
      title: 'Choose Difficulty',
      description: 'Pick how hard you want to make it. Baby Mode for your mom, Big Brain for your tech-savvy friends.',
      gradient: 'from-purple-600 to-blue-600',
    },
    {
      icon: '🚀',
      title: 'Share the Short URL',
      description: 'Send the short link to someone who "couldn\'t find it" themselves. Watch them struggle.',
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      icon: '🔍',
      title: 'They Google It',
      description: 'They\'ll see a chalkboard challenge and have to ACTUALLY SEARCH for the answer. Wild concept, right?',
      gradient: 'from-cyan-600 to-green-600',
    },
    {
      icon: '⏱️',
      title: 'Race Against Time',
      description: 'Timer counts down. Hints available (but they cost time). Pressure builds. Tears may flow.',
      gradient: 'from-green-600 to-yellow-600',
    },
    {
      icon: '🏆',
      title: 'Submit & Compete',
      description: 'If they find it, they get a score. If not... well, they learned a valuable lesson about Googling.',
      gradient: 'from-yellow-600 to-orange-600',
    },
  ];

  const features = [
    { icon: '🎮', label: 'Solo Practice Mode' },
    { icon: '🏆', label: 'Global Leaderboards' },
    { icon: '💡', label: 'Hint System' },
    { icon: '⚡', label: 'Real-time Scoring' },
    { icon: '🌍', label: 'Play Anywhere' },
    { icon: '🎨', label: 'Multiple Themes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 pt-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <h1 className="text-7xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-6">
            How It Works
          </h1>
          <p className="text-2xl text-purple-300 font-medium">
            It's not rocket science, but apparently it's needed
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8 mb-20">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ x: idx % 2 === 0 ? -50 : 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.15 }}
              className="relative"
            >
              <div className="flex items-start gap-6">
                {/* Step Number */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-2xl`}>
                  <span className="text-3xl">{step.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`text-2xl font-black bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                      Step {idx + 1}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-lg text-purple-200 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-16"
        >
          <h2 className="text-4xl font-black text-white text-center mb-8">
            ✨ Features
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 + idx * 0.1, type: 'spring', bounce: 0.5 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl p-6 border-2 border-purple-500/20 text-center"
              >
                <div className="text-5xl mb-3">{feature.icon}</div>
                <div className="text-lg font-bold text-white">{feature.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="bg-black/40 backdrop-blur-xl rounded-3xl p-10 border-2 border-purple-500/20 shadow-2xl"
        >
          <h2 className="text-4xl font-black text-white mb-8 text-center">
            ❓ FAQ
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">
                Why does this exist?
              </h3>
              <p className="text-purple-200">
                Because apparently "Just Google it" isn't clear enough for some people. Now they have to EARN their answers.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">
                Is this mean?
              </h3>
              <p className="text-purple-200">
                No, it's educational. They're learning valuable research skills. You're basically a teacher.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">
                Can I use this for work?
              </h3>
              <p className="text-purple-200">
                Absolutely! Send it to that one coworker who asks "how do I..." questions that are literally the first Google result.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">
                What if they give up?
              </h3>
              <p className="text-purple-200">
                Then they've learned an even more valuable lesson: sometimes you have to try harder. Character building!
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-center mt-16"
        >
          <motion.a
            href="/"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-16 py-6 rounded-3xl font-black text-3xl text-white bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 shadow-2xl"
          >
            🚀 Start Trolling
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
};
