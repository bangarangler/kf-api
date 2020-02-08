require('dotenv').config();

const {
  ApolloServer,
  gql,
  PubSub
} = require("apollo-server");
const {
  GraphQLScalarType
} = require("graphql");
const {
  Kind
} = require("graphql/language");

const mongoose = require('mongoose')
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@kungfu-apigql-7vptc.mongodb.net/test?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
const db = mongoose.connection;

const movieSchema = new mongoose.Schema({
  title: String,
  releaseDate: Date,
  rating: Number,
  status: String,
  actorIds: [String]
})

const Movie = mongoose.model('Movie', movieSchema)

// gql `` parser your string into an AST
const typeDefs = gql `

  scalar Date

  enum Status {
    WATCHED
    INTERESTED
    NOT_INTERESTED
    UNKNOWN
  }

  type Actor {
    id: ID!
    name: String!
  }

  type Movie {
    id: ID!
    title: String!
    releaseDate: Date
    rating: Int
    status: Status
    actor: [Actor] #valid null [] [... some data] x some data without name or id
    # actor: [Actor]! #valid [], [...some data]
    # actor: [Actor!]! #valid [... some data]
    #fake: float
    #fake: boolean
  }

  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }

  input ActorInput {
    id: ID
  }

  input MovieInput {
    id: ID
    title: String
    releaseDate: Date
    rating: Int
    status: Status
    actor: [ActorInput]
  }

  type Mutation {
    addMovie(movie: MovieInput): [Movie]
  }

  type Subscription {
    movieAdded: Movie
  }
`;

const actors = [{
    id: "gordon",
    name: "Gordon Liu"
  },
  {
    id: "jackie",
    name: "Jackie Chan"
  }
];

// const movies = [{
//     id: "jfkanfmajlg",
//     title: "5 Deadly Venoms",
//     releaseDate: new Date("10-12-1983"),
//     rating: 5,
//     actor: [{
//       id: "jackie"
//     }]
//   },
//   {
//     id: "mvhhennvhdmf",
//     title: "36th Chamber",
//     releaseDate: new Date("10-10-1983"),
//     rating: 5,
//     actor: [{
//       id: "gordon"
//     }]
//   }
// ];

const pubSub = new PubSub()
const MOVIE_ADDED = 'MOVIE_ADDED'

const resolvers = {
  Subscription: {
    movieAdded: {
      subscribe: () => pubSub.asyncIterator([MOVIE_ADDED])
    },
  },
  Query: {
    movies: async () => {
      try {
        const allMovies = await Movie.find()
        return allMovies;
      } catch (err) {
        console.log(err)
        return [];
      }
    },
    movie: async (parent, {
      id
    }, context, info) => {
      try {

        const foundMovie = await Movie.findById(id);
        return foundMovie;
      } catch (err) {
        console.log(err)
        return {};
      }
    }
  },
  Mutation: {
    addMovie: async (parent, {
      movie
    }, {
      userId
    }, info) => {
      try {
        if (userId) {
          const newMovie = await Movie.create({
            ...movie
          })
          pubSub.publish(MOVIE_ADDED, {
            movieAdded: newMovie
          })
          const allMovies = await Movie.find()
          return allMovies
        }
        return movies;
      } catch (err) {
        console.log(err)
        return [];
      }
    }
  },
  Date: new GraphQLScalarType({
    name: "Date",
    description: "it's a date",
    parseValue(value) {
      // value from client
      return new Date(value);
    },
    serialize(value) {
      // value sent to the value
      return value.getTime();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value);
      }
      return null;
    }
  }),
  Movie: {
    actor: (parent, args, context, info) => {
      console.log("parent: ", parent.actors);
      // db call usually
      const actorIds = parent.actor.map(actor => actor.id);
      const filteredActors = actors.filter(actor => {
        return actorIds.includes(actor.id);
      });
      return filteredActors;
    }
  }
  // Actor: (parent, args, context, info) => {
  //   console.log('parent: ', parent)
  //   return {
  //     id: "mgbuanghakjg",
  //     name: "Jon"
  //   }
  // }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({
    req
  }) => {
    const fakeUser = {
      userId: 'helloImauser'
    }
    return {
      ...fakeUser
    };
  }
});

db.on("error", console.error.bind(console, "connection error:"))
db.once("open", function () {
  // we're connected!
  console.log('database connected')
  server
    .listen({
      port: process.env.PORT || 4000
    })
    .then(({
      url
    }) => {
      console.log(`Server started at ${url}`);
    })
    .catch(err => {
      console.log(err);
    });
})