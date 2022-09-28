import debug from 'debug';
import * as Sentry from '@sentry/node';

const dlog = debug('that:api:garage:lib:verifySendResponse');

// checks (and optionally reports) send errors.
export default function verifySendResponse({
  postmarkResponses,
  reportErrors = true,
}) {
  dlog('checking postmark response of %d reponses', postmarkResponses?.length);
  let pmResponses = postmarkResponses;
  if (!Array.isArray(postmarkResponses)) {
    pmResponses = [postmarkResponses];
  }
  const responsesInError = [];
  pmResponses.forEach(r => {
    if (r.ErrorCode > 0) {
      responsesInError.push(r);
      if (reportErrors === true) {
        Sentry.configureScope(scope => {
          scope.setTags({
            function: 'verifySendResponse',
            emailTo: r.To,
          });
          scope.setLevel('error');
          Sentry.captureException(new Error(`error sending postmark email`));
        });
      }
    }
  });

  return {
    hasErrors: responsesInError.length > 0,
    responsesInError,
  };
}
