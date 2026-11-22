
import TransactionList from "../components/TransactionList";

function Transactions({ transactions, setTransactions }) {
  return (
    <div>
      <TransactionList
        transactions={transactions}
        setTransactions={setTransactions}
      />
    </div>
  );
}

export default Transactions;
