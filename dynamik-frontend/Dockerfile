FROM node:22-slim AS base

ENV NODE_ENV=production

FROM base AS deps

WORKDIR /dynamik

COPY ./package.json /dynamik/package.json

RUN npm install --include=dev

FROM base AS production-deps

WORKDIR /dynamik

COPY ./package.json /dynamik/package.json
COPY --from=deps /dynamik/node_modules /dynamik/node_modules

RUN npm prune --omit=dev

FROM base AS build

WORKDIR /dynamik

COPY . /dynamik
COPY --from=deps /dynamik/node_modules /dynamik/node_modules

RUN npm run build

FROM base

WORKDIR /dynamik

COPY --from=production-deps /dynamik/node_modules /dynamik/node_modules
COPY --from=build /dynamik/build /dynamik/build
COPY --from=build /dynamik/public /dynamik/public
COPY ./package.json /dynamik/package.json

CMD ["npm", "start"]