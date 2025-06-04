const BANK_CODE = "20018183";
const BRANCH = "0001";
const ACCOUNT = "6341320293482496";
const NAME = "Stark Bank S.A.";
const TAX_ID = "20.018.183/0001-80";
const ACCOUNT_TYPE = "payment";

export async function createTransfer(starkbank, event) {
  const transferObject = {
    amount: event.log.invoice.amount,
    bankCode: BANK_CODE,
    branchCode: BRANCH,
    accountNumber: ACCOUNT,
    taxId: TAX_ID,
    name: NAME,
    accountType: ACCOUNT_TYPE,
  };

  await starkbank.transfer.create([transferObject]);
}
