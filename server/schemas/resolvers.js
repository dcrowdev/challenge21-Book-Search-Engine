const { AuthenticationError } = require('apollo-server-express')
const { User } = require('../models/User')
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    user: async (parent, { userId }) => {
      return User.findOne({ _id: userId });
    },

    Mutation: {
      addUser: async (parent, { username, email, password }) => {
        const user = await User.create({ username, email, password });
        const token = signToken(user);

        return { token, profile };
      },
      login: async (parent, { email, password }) => {
        const user = await User.findOne({ email });

        if (!user) {
          throw new AuthenticationError('No profile with this email found!');
        }

        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
          throw new AuthenticationError('Incorrect password!');
        }

        const token = signToken(user);
        return { token, user };
      },

      // Add a third argument to the resolver to access data in our `context`
      saveBook: async (parent, { userId, bookId }, context) => {
        // If context has a `user` property, that means the user executing this mutation has a valid JWT and is logged in
        if (context.user) {
          return User.findOneAndUpdate(
            { _id: userId },
            {
              $addToSet: { savedBooks: bookId },
            },
            {
              new: true,
              runValidators: true,
            }
          );
        }
        // If user attempts to execute this mutation and isn't logged in, throw an error
        throw new AuthenticationError('You need to be logged in!');
      },
      // Make it so a logged in user can only remove a skill from their own profile
      deleteBook: async (parent, { bookId }, context) => {
        if (context.user) {
          return User.findOneAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: bookId } },
            { new: true }
          );
        }
        throw new AuthenticationError('You need to be logged in!');
      },
    },
  }
};

module.exports = resolvers;