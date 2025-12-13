import marimo

__generated_with = "0.18.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import requests
    import matplotlib.pyplot as plt
    import numpy as np

    return np, plt, requests


@app.cell
def _():
    GRAPHQL_ENDPOINT = "http://localhost:8080/v1/graphql"
    QUERY = """

    {
      dailyUSDT0TransferStats(limit: 100, where: {id: {_regex: "-1765497600"}}){
        id
        date
        dstChain
        srcChain
        totalAmountSent
        totalAmountReceived
        totalSentTransfers
        totalReceivedTransfers
      }
    }
    """

    return GRAPHQL_ENDPOINT, QUERY


@app.cell
def _(requests):
    def fetch_data(endpoint, query):
        res = requests.post(
            endpoint,
            json={"query": query},
            headers={"Content-Type": "application/json"},
        )
        res.raise_for_status()
        return res.json()["data"]["dailyUSDT0TransferStats"]

    return (fetch_data,)


@app.function
def prepare_chart_data(stats):
    labels = []
    sent_values = []
    received_values = []

    for row in stats:
        label = f'{row["srcChain"]} → {row["dstChain"]}'
        sent = float(row["totalAmountSent"])
        received = float(row["totalAmountReceived"])

        labels.append(label)
        sent_values.append(sent)
        received_values.append(-received)  # negative for bottom
    return labels, sent_values, received_values


@app.cell
def _(np, plt):
    def plot_diverging_barchart(labels, sent, received):
        x = np.arange(len(labels))

        sent = np.array(sent)
        received = np.abs(np.array(received))  # make positive for plotting

        plt.figure(figsize=(12, 6))

        # Sent → above X-axis
        plt.bar(x, sent, label="Sent")

        # Received → below X-axis
        plt.bar(x, -received, label="Received")

        plt.axhline(0)

        # Log scale handling (symmetric log for + and -)
        plt.yscale("symlog", linthresh=1)

        plt.xticks(x, labels, rotation=45, ha="right")
        plt.ylabel("USDT Amount (log scale)")
        plt.title("USDT0 Transfers — Sent (↑) vs Received (↓)")
        plt.legend()

        plt.tight_layout()
        plt.show()

    return (plot_diverging_barchart,)


@app.cell
def _(GRAPHQL_ENDPOINT, QUERY, fetch_data, plot_diverging_barchart):
    stats = fetch_data(GRAPHQL_ENDPOINT, QUERY)
    labels, sent, received = prepare_chart_data(stats)
    plot_diverging_barchart(labels, sent, received)

    return


if __name__ == "__main__":
    app.run()
