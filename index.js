const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
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
    releaseDate: String
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
    releaseDate: "10-10-1983",
    rating: 5
  },
  {
    id: "mvhhennvhdmf",
    title: "36th Chamber",
    releaseDate: "10-10-1983",
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
  }
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
