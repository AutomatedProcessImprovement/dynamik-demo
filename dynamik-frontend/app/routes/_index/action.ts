import { redirect } from '@remix-run/node'

import { sleep } from '~/utils/sleep'

export default async function action() {
    await sleep(1000)
    
    return redirect('/setup-experiment')
}