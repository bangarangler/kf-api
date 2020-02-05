const { ApolloServer, gql } = require("apollo-server");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");

const typeDefs = gql`
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
`;

const movies = [
  {
    id: "jfkanfmajlg",
    title: "5 Deadly Venoms",
    releaseDate: new Date("10-12-1983"),
    rating: 5
  },
  {
    id: "mvhhennvhdmf",
    title: "36th Chamber",
    releaseDate: new Date("10-10-1983"),
    rating: 5,
    actor: [
      {
        id: "jfkajlkajf",
        name: "Gordon Liu"
      }
    ]
  }
];

const resolvers = {
  Query: {
    movies: () => {
      return movies;
    },
    movie: (parent, { id }, context, info) => {
      const foundMovie = movies.find(movie => {
        return movie.id === id;
      });
      return foundMovie;
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
  })
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true
});

server
  .listen({
    port: process.env.PORT || 4000
  })
  .then(({ url }) => {
    console.log(`Server started at ${url}`);
  })
  .catch(err => {
    console.log(err);
  });
