import { defaultAbiCoder } from "@ethersproject/abi";
import { BigNumber, Contract, Signer } from "ethers";
import { getAddress, keccak256, solidityPack, toUtf8Bytes } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";

const PERMIT_TYPEHASH = keccak256(
    toUtf8Bytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
);

export function expandTo18Decimals(n: number): BigNumber {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(18));
}

function getDomainSeparator(name: string, tokenAddress: string) {
    return keccak256(
        defaultAbiCoder.encode(
            ["bytes32", "bytes32", "bytes32", "uint256", "address"],
            [
                keccak256(
                    toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                ),
                keccak256(toUtf8Bytes(name)),
                keccak256(toUtf8Bytes("1")),
                117,
                tokenAddress,
            ],
        ),
    );
}

export function getCreate2Address(
    factoryAddress: string,
    [tokenA, tokenB]: [string, string],
    bytecode: string,
): string {
    const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
    const create2Inputs = [
        "0xff",
        factoryAddress,
        keccak256(solidityPack(["address", "address"], [token0, token1])),
        keccak256(bytecode),
    ];
    const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join("")}`;
    return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
}

export async function getApprovalDigest(
    token: Contract,
    approve: {
        owner: string;
        spender: string;
        value: BigNumber;
    },
    nonce: BigNumber,
    deadline: BigNumber,
): Promise<string> {
    const name = await token.name();
    const DOMAIN_SEPARATOR = getDomainSeparator(name, token.address);
    return keccak256(
        solidityPack(
            ["bytes1", "bytes1", "bytes32", "bytes32"],
            [
                "0x19",
                "0x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    defaultAbiCoder.encode(
                        ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
                        [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline],
                    ),
                ),
            ],
        ),
    );
}

export async function setAutomine(enable: boolean) {
    await new Promise(async (resolve, reject) => {
        (hre.network.provider.sendAsync as any)(
            { jsonrpc: "2.0", method: "evm_setAutomine", params: [enable] },
            (error: any, result: any): void => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            },
        );
    });
}

export async function mineBlock(timestamp?: number) {
    if (timestamp != undefined) {
        await hre.network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    }

    await hre.network.provider.send("evm_mine");
}

export function encodePrice(reserve0: BigNumber, reserve1: BigNumber) {
    return [
        reserve1.mul(BigNumber.from(2).pow(112)).div(reserve0),
        reserve0.mul(BigNumber.from(2).pow(112)).div(reserve1),
    ];
}

export const deployContract = async (name: string, signer: Signer, ...args: any[]) => {
    const factory = await ethers.getContractFactory(name, signer);
    return factory.deploy(...args);
};
