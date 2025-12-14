import marimo

__generated_with = "0.18.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import requests
    import json
    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    from datetime import datetime, timezone
    import marimo as mo
    import altair as alt

    return datetime, np, plt, requests, timezone


@app.cell
def _():
    GRAPHQL_ENDPOINT = "http://localhost:8080/v1/graphql"
    QUERY = """

    query GetSnapshots($date: String!) {
      dailyUSDT0TransferStats(limit: 12, where: {id: {_regex: $date}}){
    id
    totalAmountSent
    totalAmountReceived
    totalSentTransfers
    totalReceivedTransfers
    date
      }
    }
    """
    return GRAPHQL_ENDPOINT, QUERY


@app.cell
def _(requests):
    def fetch_data(endpoint, query, date):
        res = requests.post(
            endpoint,
            json={
                "query": query,
                "variables": {
                    "date": date
                },
            },
            headers={"Content-Type": "application/json"},
        )
        res.raise_for_status()

        res_json = res.json()

        # pretty-print full response
        # print(json.dumps(res_json, indent=2))

        return res_json["data"]["dailyUSDT0TransferStats"]
    return (fetch_data,)


@app.function
def prepare_chart_data(stats):
    labels = []
    sent_values = []
    received_values = []

    for row in stats:
        # id format: "<chainId>-<timestamp>"
        chain_id = row["id"].split("-", 1)[0]
        label = chain_id

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
        return plt
    return (plot_diverging_barchart,)


@app.cell
def _(datetime, timezone):
    def today_midnight_utc_unix():
        today_midnight_utc = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return str(int(today_midnight_utc.timestamp()))

    return (today_midnight_utc_unix,)


@app.cell
def _(
    GRAPHQL_ENDPOINT,
    QUERY,
    fetch_data,
    plot_diverging_barchart,
    today_midnight_utc_unix,
):
    stats = fetch_data(GRAPHQL_ENDPOINT, QUERY, today_midnight_utc_unix())
    labels, sent, received = prepare_chart_data(stats)
    show_plot = plot_diverging_barchart(labels, sent, received)

    show_plot.show()
    return


if __name__ == "__main__":
    app.run()
