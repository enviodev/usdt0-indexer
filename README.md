# USDT0 Indexer (WIP)

*For a complete overview of all Envio indexer features, please visit the [Envio documentation](https://docs.envio.dev).*

This indexer tracks cross-chain USDT transfers done via **USDT0** across all HyperSync-supported networks.

## Running the Indexer

```bash
pnpm dev
```

Once running, open **[https://envio.dev/console](https://envio.dev/console)** to access the GraphQL Playground.

## Generate Types

If you make changes to config.yaml or schema.graphql, run the command below to regenerate the corresponding type files:

```bash
pnpm codegen
```

## Requirements

- [Node.js v18+](https://nodejs.org/en/download/current)
- [pnpm v8+](https://pnpm.io/installation)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)